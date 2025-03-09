package services

import (
	"context"
	"sync"

	"connectrpc.com/connect"
	pb "github.com/pixelfs/pixelfs/gen/pixelfs/v1"
	"github.com/pixelfs/pixelfs/rpc/core"
)

type StorageService struct {
	ctx context.Context
	rpc *core.GrpcV1Client
}

var storage *StorageService
var onceStorage sync.Once

func Storage() *StorageService {
	if storage == nil {
		onceStorage.Do(func() {
			storage = &StorageService{}
		})
	}

	return storage
}

func (s *StorageService) Start(ctx context.Context, rpc *core.GrpcV1Client) {
	s.ctx = ctx
	s.rpc = rpc
}

func (s *StorageService) GetStorages() ([]*pb.Storage, error) {
	response, err := s.rpc.StorageService.GetStorages(
		context.Background(),
		connect.NewRequest(&pb.GetStoragesRequest{}),
	)

	if err != nil {
		return nil, err
	}

	return response.Msg.GetStorages(), nil
}

func (s *StorageService) AddS3Storage(name string, config *pb.StorageS3Config, network pb.StorageNetwork) (*pb.AddStorageResponse, error) {
	response, err := s.rpc.StorageService.AddStorage(
		context.Background(),
		connect.NewRequest(&pb.AddStorageRequest{
			Storage: &pb.Storage{
				Name:    name,
				Type:    pb.StorageType_S3,
				Network: network,
				Config:  &pb.Storage_S3{S3: config},
			},
		}),
	)

	if err != nil {
		return nil, err
	}

	return response.Msg, nil
}

func (s *StorageService) RemoveStorage(storageId string) error {
	_, err := s.rpc.StorageService.RemoveStorage(
		context.Background(),
		connect.NewRequest(&pb.RemoveStorageRequest{
			StorageId: storageId,
		}),
	)
	if err != nil {
		return err
	}

	return nil
}

func (s *StorageService) GetStorageLinks() ([]*pb.StorageLink, error) {
	response, err := s.rpc.StorageService.GetStorageLinks(
		context.Background(),
		connect.NewRequest(&pb.GetStorageLinksRequest{}),
	)

	if err != nil {
		return nil, err
	}

	return response.Msg.GetStorageLinks(), nil
}

func (s *StorageService) AddStorageLink(storageLink *pb.StorageLink) (*pb.AddStorageLinkResponse, error) {
	response, err := s.rpc.StorageService.AddStorageLink(
		context.Background(),
		connect.NewRequest(&pb.AddStorageLinkRequest{
			StorageLink: storageLink,
		}),
	)
	if err != nil {
		return nil, err
	}

	return response.Msg, nil

}

func (s *StorageService) RemoveStorageLink(storageLinkId string) error {
	_, err := s.rpc.StorageService.RemoveStorageLink(
		context.Background(),
		connect.NewRequest(&pb.RemoveStorageLinkRequest{
			StorageLinkId: storageLinkId,
		}),
	)
	if err != nil {
		return err
	}

	return nil
}

func (s *StorageService) CleanStorageLink(storageLinkId string) error {
	_, err := s.rpc.StorageService.CleanStorageLink(
		context.Background(),
		connect.NewRequest(&pb.CleanStorageLinkRequest{
			StorageLinkId: storageLinkId,
		}),
	)
	if err != nil {
		return err
	}

	return nil
}
