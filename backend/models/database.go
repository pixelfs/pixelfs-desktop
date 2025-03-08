package models

import (
	"gorm.io/gorm"
)

type Upload struct {
	gorm.Model

	NodeId   string
	Location string
	Path     string
	Status   string
	Progress int
}

type Download struct {
	gorm.Model

	NodeId    string
	Location  string
	Path      string
	LocalPath string
	Status    string
	Progress  int
}

type Copy struct {
	gorm.Model

	NodeId   string
	Location string
	Path     string
	Status   string
	Progress int
}
