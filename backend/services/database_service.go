package services

import (
	"context"
	"path/filepath"
	"sync"
	"time"

	"github.com/pixelfs/pixelfs-desktop/backend/models"
	"github.com/pixelfs/pixelfs/log"
	"github.com/pixelfs/pixelfs/util"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type DatabaseService struct {
	ctx context.Context
	db  *gorm.DB
}

var database *DatabaseService
var onceDatabase sync.Once

func Database() *DatabaseService {
	if database == nil {
		onceDatabase.Do(func() {
			database = &DatabaseService{}
		})
	}

	return database
}

func (d *DatabaseService) Start(ctx context.Context) {
	home, err := util.GetHomeDir()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to get home dir")
	}

	d.db, err = gorm.Open(sqlite.Open(filepath.Join(home, "application.sqlite")), &gorm.Config{})
	if err != nil {
		log.Fatal().Err(err).Msg("failed to open database")
	}

	if err = d.db.AutoMigrate(&models.Upload{}, &models.Download{}, &models.Copy{}); err != nil {
		log.Fatal().Err(err).Msg("failed to migrate database")
	}

	d.ctx = ctx
}

func (d *DatabaseService) GetUploadList() ([]*models.Upload, error) {
	var uploads []*models.Upload
	if err := d.db.Order("id desc").Find(&uploads).Error; err != nil {
		return nil, err
	}

	time.Sleep(200 * time.Millisecond)
	return uploads, nil
}

func (d *DatabaseService) DeleteUpload(id uint) error {
	return d.db.Delete(&models.Upload{}, id).Error
}

func (d *DatabaseService) GetDownloadList() ([]*models.Download, error) {
	var downloads []*models.Download
	if err := d.db.Order("id desc").Find(&downloads).Error; err != nil {
		return nil, err
	}

	time.Sleep(200 * time.Millisecond)
	return downloads, nil
}

func (d *DatabaseService) DeleteDownload(id uint) error {
	return d.db.Delete(&models.Download{}, id).Error
}

func (d *DatabaseService) GetCopyList() ([]*models.Copy, error) {
	var copies []*models.Copy
	if err := d.db.Order("id desc").Find(&copies).Error; err != nil {
		return nil, err
	}

	time.Sleep(200 * time.Millisecond)
	return copies, nil
}

func (d *DatabaseService) DeleteCopy(id uint) error {
	return d.db.Delete(&models.Copy{}, id).Error
}
