package services

import (
	"context"
	"fmt"
	"github.com/pixelfs/pixelfs/util"
	"os/exec"
	rt "runtime"
	"sync"

	"github.com/pixelfs/pixelfs/config"
	"github.com/pixelfs/pixelfs/pixelfsd"
	"github.com/pixelfs/pixelfs/pixelfsd/ws"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type SystemService struct {
	ctx context.Context
	cfg *config.Config
}

var system *SystemService
var onceSystem sync.Once

func System() *SystemService {
	if system == nil {
		onceSystem.Do(func() {
			system = &SystemService{}
		})
	}

	return system
}

func (s *SystemService) Start(ctx context.Context, cfg *config.Config) {
	s.ctx = ctx
	s.cfg = cfg
}

func (s *SystemService) Stop() {
	ws.StopClient()
}

func (s *SystemService) StartWebsocketClient() {
	if err := ws.StartClient(s.cfg); err != nil {
		result, _ := runtime.MessageDialog(s.ctx, runtime.MessageDialogOptions{
			Type:          runtime.ErrorDialog,
			Title:         "连接错误",
			Message:       err.Error(),
			Buttons:       []string{"重新连接", "取消"},
			DefaultButton: "重新连接",
		})

		if result == "重新连接" {
			ws.StopClient()
			s.StartWebsocketClient()
		}
	}

	pixelfsd.CleanFFmpegCache(s.cfg)
}

func (s *SystemService) StopWebsocketClient() {
	ws.StopClient()
}

func (s *SystemService) OpenFile(filePath string) error {
	var cmd *exec.Cmd

	switch rt.GOOS {
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", filePath)
	case "darwin":
		cmd = exec.Command("open", filePath)
	case "linux":
		cmd = exec.Command("xdg-open", filePath)
	default:
		return fmt.Errorf("unsupported platform")
	}

	return cmd.Start()
}

func (s *SystemService) SelectDirectoryDialog(title string) (string, error) {
	return runtime.OpenDirectoryDialog(s.ctx, runtime.OpenDialogOptions{
		Title:           title,
		ShowHiddenFiles: true,
	})
}

func (s *SystemService) FormatBytes(bytes uint64) string {
	return util.Bytes(bytes)
}

func (s *SystemService) ParseBytes(str string) (uint64, error) {
	return util.ParseBytes(str)
}
