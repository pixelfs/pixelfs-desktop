package services

import (
	"os"
	"path/filepath"
	"sync"
)

type PreferencesService struct{}

var preferences *PreferencesService
var oncePreferences sync.Once

func NewPreferencesService() *PreferencesService {
	if preferences == nil {
		oncePreferences.Do(func() {
			preferences = &PreferencesService{}
		})
	}

	return preferences
}

func (p *PreferencesService) GetDownloadPath() (string, error) {
	downloadPath, err := localStorage.GetLocalStorage("downloadPath")
	if err != nil {
		return "", err
	}

	if downloadPath != nil {
		return downloadPath.(string), nil
	}

	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	return filepath.Join(home, "Downloads"), nil
}

func (p *PreferencesService) SetDownloadPath(path string) error {
	stat, err := os.Stat(path)
	if err != nil {
		return err
	}

	if !stat.IsDir() {
		return os.ErrNotExist
	}

	return localStorage.SetLocalStorage("downloadPath", path)
}

func (p *PreferencesService) GetDownloadThreads() (int, error) {
	downloadThreads, err := localStorage.GetLocalStorage("downloadThreads")
	if err != nil {
		return 0, err
	}

	if downloadThreads != nil {
		return int(downloadThreads.(float64)), nil
	}

	return 1, nil
}

func (p *PreferencesService) SetDownloadThreads(threads int) error {
	return localStorage.SetLocalStorage("downloadThreads", threads)
}
