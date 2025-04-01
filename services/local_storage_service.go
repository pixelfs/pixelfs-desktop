package services

import (
	"context"
	"os"
	"path/filepath"
	"sync"

	"github.com/pixelfs/pixelfs/util"
	"github.com/tidwall/gjson"
	"github.com/tidwall/sjson"
	"github.com/wailsapp/wails/v3/pkg/application"
)

type LocalStorageService struct {
	ctx  context.Context
	path string
}

var localStorage *LocalStorageService
var onceLocalStorage sync.Once

func NewLocalStorageService() *LocalStorageService {
	if localStorage == nil {
		onceLocalStorage.Do(func() {
			localStorage = &LocalStorageService{}
		})
	}

	return localStorage
}

func (ls *LocalStorageService) OnStartup(ctx context.Context, _ application.ServiceOptions) error {
	home, err := util.GetHomeDir()
	if err != nil {
		return err
	}

	ls.ctx = ctx
	ls.path = filepath.Join(home, "application.storage")

	if _, err = os.Stat(ls.path); err != nil {
		if os.IsNotExist(err) {
			if _, err := os.Create(ls.path); err != nil {
				return err
			}
		} else {
			return err
		}
	}

	return nil
}

func (ls *LocalStorageService) SetLocalStorage(path string, value any) error {
	data, err := os.ReadFile(ls.path)
	if err != nil {
		return err
	}

	bytes, err := sjson.SetBytes(data, path, value)
	if err != nil {
		return err
	}

	return os.WriteFile(ls.path, bytes, 0o600)
}

func (ls *LocalStorageService) GetLocalStorage(path string) (any, error) {
	data, err := os.ReadFile(ls.path)
	if err != nil {
		return nil, err
	}

	return gjson.GetBytes(data, path).Value(), nil
}

func (ls *LocalStorageService) DelLocalStorage(path string) error {
	data, err := os.ReadFile(ls.path)
	if err != nil {
		return err
	}

	bytes, err := sjson.DeleteBytes(data, path)
	if err != nil {
		return err
	}

	return os.WriteFile(ls.path, bytes, 0o600)
}
