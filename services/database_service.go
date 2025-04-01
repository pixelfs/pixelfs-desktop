package services

import (
	"context"
	"path/filepath"
	"sync"
	"time"

	"github.com/pixelfs/pixelfs/util"
	"github.com/wailsapp/wails/v3/pkg/application"
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

func NewDatabaseService() *DatabaseService {
	if database == nil {
		onceDatabase.Do(func() {
			database = &DatabaseService{}
		})
	}

	return database
}

func (d *DatabaseService) OnStartup(ctx context.Context, _ application.ServiceOptions) error {
	home, err := util.GetHomeDir()
	if err != nil {
		return err
	}

	d.db, err = gorm.Open(sqlite.Open(filepath.Join(home, "application.sqlite")), &gorm.Config{})
	if err != nil {
		return err
	}

	if err = d.db.AutoMigrate(&TransportManager{}); err != nil {
		return err
	}

	d.ctx = ctx
	return nil
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
