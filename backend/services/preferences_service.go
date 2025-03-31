package services

import (
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/pixelfs/pixelfs/util"
)

type PreferencesService struct{}

var preferences *PreferencesService
var oncePreferences sync.Once

func Preferences() *PreferencesService {
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

func (p *PreferencesService) ReadLog(reverse bool) ([]string, error) {
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

func (p *PreferencesService) ClearLog() error {
	home, err := util.GetHomeDir()
	if err != nil {
		return err
	}

	return os.WriteFile(filepath.Join(home, "logs", "pixelfs.log"), []byte{}, 0644)
}
