package services

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"connectrpc.com/connect"
	"github.com/pixelfs/pixelfs-desktop/backend/models"
	"github.com/pixelfs/pixelfs/config"
	pb "github.com/pixelfs/pixelfs/gen/pixelfs/v1"
	"github.com/pixelfs/pixelfs/util"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type FileService struct {
	ctx context.Context
}

type downloadBlockResult struct {
	index int64
	data  []byte
	err   error
}

var file *FileService
var onceFile sync.Once

func File() *FileService {
	if file == nil {
		onceFile.Do(func() {
			file = &FileService{}
		})
	}

	return file
}

func (f *FileService) Start(ctx context.Context) {
	f.ctx = ctx
}

func (f *FileService) GetFileList(ctx *pb.FileContext) ([]*pb.File, error) {
	response, err := rpc.FileSystemService.List(
		context.Background(),
		connect.NewRequest(&pb.FileListRequest{
			Context: ctx,
		}),
	)

	if err != nil {
		return nil, err
	}

	return response.Msg.GetFiles(), nil
}

func (f *FileService) RemoveFile(ctx *pb.FileContext) error {
	_, err := rpc.FileSystemService.Remove(
		context.Background(),
		connect.NewRequest(&pb.FileRemoveRequest{
			Context:   ctx,
			Recursive: true,
		}),
	)
	if err != nil {
		return err
	}

	return nil
}

func (f *FileService) Mkdir(ctx *pb.FileContext) error {
	_, err := rpc.FileSystemService.Mkdir(
		context.Background(),
		connect.NewRequest(&pb.FileMkdirRequest{
			Context: ctx,
		}),
	)
	if err != nil {
		return err
	}

	return nil
}

func (f *FileService) MoveFile(src *pb.FileContext, dest *pb.FileContext) error {
	go func() {
		if err := f.copyFile(src, dest); err != nil {
			runtime.MessageDialog(f.ctx, runtime.MessageDialogOptions{
				Type:    runtime.ErrorDialog,
				Title:   "文件移动错误",
				Message: err.Error(),
			})

			return
		}

		_, err := rpc.FileSystemService.Remove(
			context.Background(),
			connect.NewRequest(&pb.FileRemoveRequest{
				Context:   src,
				Recursive: true,
			}),
		)

		if err != nil {
			runtime.MessageDialog(f.ctx, runtime.MessageDialogOptions{
				Type:    runtime.ErrorDialog,
				Title:   "文件移动错误",
				Message: err.Error(),
			})
		}
	}()

	return nil
}

func (f *FileService) CopyFile(src *pb.FileContext, dest *pb.FileContext) error {
	go func() {
		if err := f.copyFile(src, dest); err != nil {
			runtime.MessageDialog(f.ctx, runtime.MessageDialogOptions{
				Type:    runtime.ErrorDialog,
				Title:   "文件复制错误",
				Message: err.Error(),
			})
		}
	}()

	return nil
}

func (f *FileService) copyFile(src *pb.FileContext, dest *pb.FileContext) error {
	if src.NodeId == dest.NodeId {
		copyModel := models.Copy{NodeId: src.NodeId, Location: src.Location, Path: src.Path, Status: "copying", Progress: 0}
		if err := database.db.Create(&copyModel).Error; err != nil {
			return err
		}

		_, err := rpc.FileSystemService.Copy(
			context.Background(),
			connect.NewRequest(&pb.FileCopyRequest{
				Src:  src,
				Dest: dest,
			}),
		)

		if err != nil {
			database.db.Model(&copyModel).Update("status", "failed")
			return err
		}

		if err = database.db.Model(copyModel).Updates(models.Copy{Progress: 100, Status: "success"}).Error; err != nil {
			return err
		}

		return err
	}

	stat, err := rpc.FileSystemService.Stat(
		context.Background(),
		connect.NewRequest(&pb.FileStatRequest{
			Context: src,
			Hash:    true,
		}),
	)
	if err != nil {
		return err
	}

	if stat.Msg.File.Type == pb.FileType_DIR {
		_, err = rpc.FileSystemService.Mkdir(
			context.Background(),
			connect.NewRequest(&pb.FileMkdirRequest{
				Context: dest,
			}),
		)
		if err != nil {
			return err
		}

		list, err := rpc.FileSystemService.List(
			context.Background(),
			connect.NewRequest(&pb.FileListRequest{
				Context: src,
			}),
		)
		if err != nil {
			return err
		}

		for _, fileInfo := range list.Msg.Files {
			if err := f.copyFile(
				&pb.FileContext{
					NodeId:   src.NodeId,
					Location: src.Location,
					Path:     filepath.Join(src.Path, fileInfo.Name),
				},
				&pb.FileContext{
					NodeId:   dest.NodeId,
					Location: dest.Location,
					Path:     filepath.Join(dest.Path, fileInfo.Name),
				},
			); err != nil {
				return err
			}
		}

		return nil
	}

	locationRsp, err := rpc.LocationService.GetLocationByContext(
		context.Background(),
		connect.NewRequest(&pb.GetLocationByContextRequest{
			Context: src,
		}),
	)
	if err != nil {
		return err
	}

	blockCount := stat.Msg.File.Size / locationRsp.Msg.Location.BlockSize
	copyModel := models.Copy{NodeId: src.NodeId, Location: src.Location, Path: src.Path, Status: "copying", Progress: 0}
	if err = database.db.Create(&copyModel).Error; err != nil {
		return err
	}

	for index := int64(0); index <= blockCount; index++ {
		var read *connect.Response[pb.FileReadResponse]
		for retries := 0; retries < 20; retries++ {
			read, err = rpc.FileSystemService.Read(
				context.Background(),
				connect.NewRequest(&pb.FileReadRequest{
					Context:    src,
					BlockType:  pb.BlockType_SIZE,
					BlockIndex: index,
				}),
			)
			if err != nil {
				database.db.Model(&copyModel).Update("status", "failed")
				return err
			}

			if read.Msg.BlockStatus != pb.BlockStatus_PENDING {
				break
			}

			time.Sleep(5 * time.Second)
		}

		if read == nil || read.Msg.BlockStatus == pb.BlockStatus_PENDING {
			database.db.Model(&copyModel).Update("status", "failed")
			return fmt.Errorf("block %d is still pending after retries", index)
		}

		_, err := rpc.FileSystemService.Write(
			context.Background(),
			connect.NewRequest(&pb.FileWriteRequest{
				Context:    dest,
				Hash:       stat.Msg.File.Hash,
				BlockType:  pb.BlockType_SIZE,
				BlockIndex: index,
				Offset:     index * locationRsp.Msg.Location.BlockSize,
				Url:        read.Msg.Url,
			}),
		)
		if err != nil {
			database.db.Model(&copyModel).Update("status", "failed")
			return err
		}

		progress := int(float64(index+1) / float64(blockCount+1) * 100)
		status := "copying"
		if index == blockCount {
			status = "success"
		}
		if err = database.db.Model(copyModel).Updates(models.Copy{Progress: progress, Status: status}).Error; err != nil {
			return err
		}
	}

	return nil
}

func (f *FileService) DownloadFile(ctx *pb.FileContext) error {
	_, fileName := filepath.Split(ctx.Path)
	downloadPath, err := preferences.GetDownloadPath()
	if err != nil {
		return err
	}

	outputFilePath, _ := runtime.SaveFileDialog(f.ctx, runtime.SaveDialogOptions{
		Title:            "Download File",
		DefaultDirectory: downloadPath,
		DefaultFilename:  fileName,
		ShowHiddenFiles:  true,
	})

	if outputFilePath == "" {
		return errors.New("cancel")
	}

	downloadThreads, err := preferences.GetDownloadThreads()
	if err != nil {
		return err
	}

	go func() {
		if err = f.downloadFile(ctx, outputFilePath, downloadThreads); err != nil {
			runtime.MessageDialog(f.ctx, runtime.MessageDialogOptions{
				Type:    runtime.ErrorDialog,
				Title:   "下载错误",
				Message: err.Error(),
			})
		}
	}()

	return err
}

func (f *FileService) downloadFile(ctx *pb.FileContext, output string, thread int) error {
	stat, err := rpc.FileSystemService.Stat(
		context.Background(),
		connect.NewRequest(&pb.FileStatRequest{
			Context: ctx,
		}),
	)
	if err != nil {
		return err
	}

	_, fileName := filepath.Split(ctx.Path)
	if output == "" {
		dir, err := os.Getwd()
		if err != nil {
			return err
		}

		output = filepath.Join(dir, fileName)
	}

	if stat.Msg.File.Type == pb.FileType_DIR {
		if err := os.MkdirAll(output, 0755); err != nil {
			return err
		}

		list, err := rpc.FileSystemService.List(
			context.Background(),
			connect.NewRequest(&pb.FileListRequest{
				Context: ctx,
			}),
		)
		if err != nil {
			return err
		}

		for _, fileInfo := range list.Msg.Files {
			if err := f.downloadFile(
				&pb.FileContext{
					NodeId:   ctx.NodeId,
					Location: ctx.Location,
					Path:     filepath.Join(ctx.Path, fileInfo.Name),
				},
				filepath.Join(output, fileInfo.Name),
				thread,
			); err != nil {
				return err
			}
		}

		return nil
	}

	locationRsp, err := rpc.LocationService.GetLocationByContext(
		context.Background(),
		connect.NewRequest(&pb.GetLocationByContextRequest{
			Context: ctx,
		}),
	)
	if err != nil {
		return err
	}

	blockCount := stat.Msg.File.Size / locationRsp.Msg.Location.BlockSize
	downloadModel := models.Download{NodeId: ctx.NodeId, Location: ctx.Location, Path: ctx.Path, LocalPath: output, Status: "downloading", Progress: 0}
	if err = database.db.Create(&downloadModel).Error; err != nil {
		return err
	}

	outputFile, err := os.OpenFile(output, os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return fmt.Errorf("failed to open output file: %w", err)
	}
	defer outputFile.Close()

	var wg sync.WaitGroup
	ch := make(chan int64, thread)
	resultCh := make(chan downloadBlockResult)

	go func() {
		for index := int64(0); index <= blockCount; index++ {
			ch <- index
		}
		close(ch)
	}()

	for i := 0; i < thread; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for index := range ch {
				var err error
				var read *connect.Response[pb.FileReadResponse]

				for retries := 0; retries < 20; retries++ {
					read, err = rpc.FileSystemService.Read(
						context.Background(),
						connect.NewRequest(&pb.FileReadRequest{
							Context:    ctx,
							BlockType:  pb.BlockType_SIZE,
							BlockIndex: index,
						}),
					)

					if err != nil {
						resultCh <- downloadBlockResult{index: index, err: fmt.Errorf("failed to read block %d: %w", index, err)}
						return
					}

					if read.Msg.BlockStatus != pb.BlockStatus_PENDING {
						break
					}

					time.Sleep(5 * time.Second)
				}

				if read == nil || read.Msg.BlockStatus == pb.BlockStatus_PENDING {
					resultCh <- downloadBlockResult{index: index, err: fmt.Errorf("block %d is still pending after retries", index)}
					return
				}

				resp, err := util.Resty.R().Get(read.Msg.Url)
				if err != nil {
					resultCh <- downloadBlockResult{index: index, err: fmt.Errorf("failed to download block %d: %w", index, err)}
					return
				}

				resultCh <- downloadBlockResult{index: index, data: resp.Body()}
			}
		}()
	}

	go func() {
		wg.Wait()
		close(resultCh)
	}()

	var writeIndex int64
	results := make(map[int64][]byte)

	for res := range resultCh {
		if res.err != nil {
			database.db.Model(&downloadModel).Update("status", "failed")
			return res.err
		}

		results[res.index] = res.data
		for {
			data, ok := results[writeIndex]
			if !ok {
				break
			}

			if _, err := outputFile.Write(data); err != nil {
				return fmt.Errorf("failed to write to destination file: %w", err)
			}

			progress := int(float64(writeIndex+1) / float64(blockCount+1) * 100)
			status := "downloading"
			if writeIndex == blockCount {
				status = "success"
			}
			if err = database.db.Model(downloadModel).Updates(models.Download{Progress: progress, Status: status}).Error; err != nil {
				return err
			}

			delete(results, writeIndex)
			writeIndex++
		}
	}

	return nil
}

func (f *FileService) UploadFile(ctx *pb.FileContext) error {
	inputFilePath, _ := runtime.OpenFileDialog(f.ctx, runtime.OpenDialogOptions{
		Title:           "Upload File",
		ShowHiddenFiles: true,
	})

	if inputFilePath == "" {
		return errors.New("cancel")
	}

	_, fileName := filepath.Split(inputFilePath)
	ctx.Path = filepath.Join(ctx.Path, fileName)

	uploadModel := models.Upload{NodeId: ctx.NodeId, Location: ctx.Location, Path: ctx.Path, Status: "uploading", Progress: 0}
	if err := database.db.Create(&uploadModel).Error; err != nil {
		return err
	}

	go func() {
		if err := f.uploadFile(ctx, inputFilePath, &uploadModel); err != nil {
			database.db.Model(&uploadModel).Update("status", "failed")
			runtime.MessageDialog(f.ctx, runtime.MessageDialogOptions{
				Type:    runtime.ErrorDialog,
				Title:   "上传错误",
				Message: err.Error(),
			})
		}
	}()

	return nil
}

func (f *FileService) uploadFile(ctx *pb.FileContext, inputFilePath string, uploadModel *models.Upload) error {
	locationRsp, err := rpc.LocationService.GetLocationByContext(
		context.Background(),
		connect.NewRequest(&pb.GetLocationByContextRequest{
			Context: ctx,
		}),
	)
	if err != nil {
		return err
	}

	inputFile, err := os.Open(inputFilePath)
	if err != nil {
		return err
	}
	defer inputFile.Close()

	inputFileInfo, err := inputFile.Stat()
	if err != nil {
		return err
	}

	hash, err := util.GetFileHash(inputFilePath)
	if err != nil {
		return err
	}

	blockCount := inputFileInfo.Size() / locationRsp.Msg.Location.BlockSize

	for index := int64(0); index <= blockCount; index++ {
		offset := index * locationRsp.Msg.Location.BlockSize
		if offset >= inputFileInfo.Size() {
			offset = inputFileInfo.Size() - 1
		}

		blockSize := locationRsp.Msg.Location.BlockSize
		if offset+blockSize > inputFileInfo.Size() {
			blockSize = inputFileInfo.Size() - offset
		}

		storageRsp, err := rpc.StorageService.Upload(
			context.Background(),
			connect.NewRequest(&pb.StorageUploadRequest{
				Context:    ctx,
				Hash:       hash,
				BlockType:  pb.BlockType_SIZE,
				BlockIndex: index,
				BlockSize:  blockSize,
			}),
		)
		if err != nil {
			return err
		}

		buffer := make([]byte, blockSize)
		if _, err = inputFile.ReadAt(buffer, offset); err != nil && err != io.EOF {
			return err
		}

		if _, err = util.Resty.R().SetBody(buffer).Put(storageRsp.Msg.Url); err != nil {
			return err
		}

		_, err = rpc.FileSystemService.Write(
			context.Background(),
			connect.NewRequest(&pb.FileWriteRequest{
				Context:    ctx,
				Hash:       hash,
				BlockType:  pb.BlockType_SIZE,
				BlockIndex: index,
			}),
		)
		if err != nil {
			return err
		}

		progress := int(float64(index+1) / float64(blockCount+1) * 100)
		status := "uploading"
		if index == blockCount {
			status = "success"
		}
		if err = database.db.Model(uploadModel).Updates(models.Upload{Progress: progress, Status: status}).Error; err != nil {
			return err
		}
	}

	return nil
}

func (f *FileService) PlayVideo(ctx *pb.FileContext) error {
	response, err := rpc.FileSystemService.M3U8(
		context.Background(),
		connect.NewRequest(&pb.FileM3U8Request{
			Context:       ctx,
			BlockSettings: &pb.BlockSettings{},
		}),
	)

	if err != nil {
		return err
	}

	signature, err := f.extractSignature(response.Msg.Url)
	if err != nil {
		return err
	}

	cfg, err := config.GetConfig()
	if err != nil {
		return err
	}

	runtime.BrowserOpenURL(f.ctx, cfg.Endpoint+"/player/"+signature)
	return nil
}

func (f *FileService) extractSignature(m3u8 string) (string, error) {
	parsedURL, err := url.Parse(m3u8)
	if err != nil {
		return "", fmt.Errorf("failed to parse url: %w", err)
	}

	parts := strings.Split(parsedURL.Path, "/")
	return parts[2], nil
}
