package services

import (
	"github.com/pixelfs/pixelfs/util"
)

type UtilService struct{}

func NewUtilService() *UtilService {
	return &UtilService{}
}

func (u *UtilService) FormatBytes(bytes uint64) string {
	return util.Bytes(bytes)
}

func (u *UtilService) ParseBytes(str string) (uint64, error) {
	return util.ParseBytes(str)
}
