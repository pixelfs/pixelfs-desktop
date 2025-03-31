package services

import (
	"context"
	"path/filepath"
	"sync"
	"time"

	"github.com/pixelfs/pixelfs/log"
	"github.com/pixelfs/pixelfs/util"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type DatabaseService struct {
	ctx context.Context
	db  *gorm.DB
}

type TransportManager struct {
	gorm.Model

	Type     string // upload, download, copy
	NodeId   string
	Location string
	Path     string
	Status   string
	Progress int

	LocalPath *string
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

	if err = d.db.AutoMigrate(&TransportManager{}); err != nil {
		log.Fatal().Err(err).Msg("failed to migrate database")
	}

	d.ctx = ctx
}

func (d *DatabaseService) GetTransportManagers(typ string) ([]*TransportManager, error) {
	var transports []*TransportManager
	if err := d.db.Where("type = ?", typ).Order("id desc").Find(&transports).Error; err != nil {
		return nil, err
	}

	time.Sleep(200 * time.Millisecond)
	return transports, nil
}

func (d *DatabaseService) DeleteTransportManager(id uint) error {
	return d.db.Unscoped().Delete(&TransportManager{}, id).Error
}

func (d *DatabaseService) DeleteTransportManagerByType(typ string) error {
	return d.db.Unscoped().Where("type = ?", typ).Delete(&TransportManager{}).Error
}
