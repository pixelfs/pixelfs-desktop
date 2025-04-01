package services

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	rt "runtime"
	"strings"
	"sync"

	"github.com/pixelfs/pixelfs/config"
	"github.com/pixelfs/pixelfs/pixelfsd"
	"github.com/pixelfs/pixelfs/pixelfsd/ws"
	"github.com/pixelfs/pixelfs/rpc/core"
	"github.com/pixelfs/pixelfs/util"
	"github.com/wailsapp/wails/v3/pkg/application"
)

type SystemService struct{}

var (
	rpc *core.GrpcV1Client

	system     *SystemService
	onceSystem sync.Once
)

func NewSystemService() *SystemService {
	if system == nil {
		onceSystem.Do(func() {
			cfg, _ := config.GetConfig()
			rpc = core.NewGrpcV1Client(cfg)

			system = &SystemService{}
		})
	}

	return system
}

func (s *SystemService) OnShutdown() error {
	ws.StopClient()
	return nil
}

func (s *SystemService) StartWebsocketClient() error {
	cfg, err := config.GetConfig()
	if err != nil {
		return err
	}

	if err := ws.StartClient(cfg); err != nil {
		dialog := application.QuestionDialog().
			SetTitle("连接错误").
			SetMessage(err.Error())

		reconnect := dialog.AddButton("重新连接").OnClick(func() {
			_ = s.StartWebsocketClient()
		})

		dialog.AddButton("取消")
		dialog.SetDefaultButton(reconnect).Show()
	}

	rpc = core.NewGrpcV1Client(cfg)
	pixelfsd.CleanFFmpegCache(cfg)
	return nil
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
	dialog := application.OpenFileDialog()
	dialog.SetOptions(&application.OpenFileDialogOptions{
		Title:                title,
		ShowHiddenFiles:      true,
		CanCreateDirectories: true,
		CanChooseDirectories: true,
	})

	return dialog.PromptForSingleSelection()
}

func (p *SystemService) ReadLog(reverse bool) ([]string, error) {
	home, err := util.GetHomeDir()
	if err != nil {
		return nil, err
	}

	logFile := filepath.Join(filepath.Join(home, "logs"), "pixelfs.log")
	content, err := os.ReadFile(logFile)
	if err != nil {
		return nil, err
	}

	lines := strings.Split(string(content), "\n")
	if reverse {
		for i, j := 0, len(lines)-1; i < j; i, j = i+1, j-1 {
			lines[i], lines[j] = lines[j], lines[i]
		}
	}

	return lines, nil
}

func (p *SystemService) ClearLog() error {
	home, err := util.GetHomeDir()
	if err != nil {
		return err
	}

	return os.WriteFile(filepath.Join(home, "logs", "pixelfs.log"), []byte{}, 0644)
}
