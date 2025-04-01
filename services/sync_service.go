package services

import (
	"context"
	"sync"

	"connectrpc.com/connect"
	pb "github.com/pixelfs/pixelfs/gen/pixelfs/v1"
)

type FileSyncService struct{}

var fileSync *FileSyncService
var onceFileSync sync.Once

func NewFileSyncService() *FileSyncService {
	if fileSync == nil {
		onceFileSync.Do(func() {
			fileSync = &FileSyncService{}
		})
	}

	return fileSync
}

func (fs *FileSyncService) GetFileSyncList() ([]*pb.Sync, error) {
	response, err := rpc.SyncService.GetSyncList(
		context.Background(),
		connect.NewRequest(&pb.SyncGetListRequest{}),
	)

	if err != nil {
		return nil, err
	}

	return response.Msg.GetSyncs(), nil
}

func (fs *FileSyncService) AddFileSync(sync *pb.Sync) (*pb.Sync, error) {
	response, err := rpc.SyncService.CreateSync(
		context.Background(),
		connect.NewRequest(&pb.SyncCreateRequest{
			Sync: sync,
		}),
	)
	if err != nil {
		return nil, err
	}

	return response.Msg.GetSync(), err
}

func (fs *FileSyncService) RemoveFileSync(syncId string) error {
	_, err := rpc.SyncService.RemoveSync(
		context.Background(),
		connect.NewRequest(&pb.SyncRemoveRequest{
			SyncId: syncId,
		}),
	)

	return err
}

func (fs *FileSyncService) StartFileSync(sync *pb.Sync) error {
	if !sync.Enabled {
		return nil
	}

	if err := fs.startSync(sync.Id, sync.SrcNodeId); err != nil {
		return err
	}

	targetFunc := fs.stopSync
	if sync.Config.Duplex {
		targetFunc = fs.startSync
	}

	return targetFunc(sync.Id, sync.DestNodeId)
}

func (fs *FileSyncService) StopFileSync(sync *pb.Sync) error {
	if err := fs.stopSync(sync.Id, sync.SrcNodeId); err != nil {
		return err
	}
	if err := fs.stopSync(sync.Id, sync.DestNodeId); err != nil {
		return err
	}

	return nil
}

func (fs *FileSyncService) startSync(syncId, nodeId string) error {
	_, err := rpc.SyncService.Start(
		context.Background(),
		connect.NewRequest(&pb.SyncStartRequest{
			SyncId: syncId,
			NodeId: nodeId,
		}),
	)

	return err
}

func (fs *FileSyncService) stopSync(syncId, nodeId string) error {
	_, err := rpc.SyncService.Stop(
		context.Background(),
		connect.NewRequest(&pb.SyncStopRequest{
			SyncId: syncId,
			NodeId: nodeId,
		}),
	)

	return err
}
