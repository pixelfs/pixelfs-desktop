import {
  ActionIcon,
  Anchor,
  Breadcrumbs,
  Divider,
  Table,
  Text,
  Center,
  Loader,
  Group,
  Button,
  Box,
  Menu,
  useMantineColorScheme,
  UnstyledButton,
  Code,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { isEmpty, orderBy } from 'lodash-es';
import { useEffect, useState } from 'react';
import { FiMoreHorizontal } from 'react-icons/fi';
import { isMacOS } from '../../utils/platform';
import { GoCopy, GoFileDirectoryFill, GoMoveToEnd } from 'react-icons/go';
import { FaRegFileAlt } from 'react-icons/fa';
import { formatBytes } from 'bytes-formatter';
import { GrRefresh } from 'react-icons/gr';
import { IoHomeOutline } from 'react-icons/io5';
import { v1 } from '../../../wailsjs/go/models';
import {
  CopyFile,
  DownloadFile,
  GetFileList,
  MoveFile,
  RemoveFile,
  UploadFile,
} from '../../../wailsjs/go/services/FileService';
import { CgRename } from 'react-icons/cg';
import { RiDeleteBinLine, RiDownloadLine } from 'react-icons/ri';
import { NewDirectory } from './NewDirectory';
import { RenameFile } from './RenameFile';
import { notifications } from '@mantine/notifications';
import { FileTree } from '../Modal';
import { FileInfo } from './FileInfo';
import { GetStorageLinks } from '../../../wailsjs/go/services/StorageService';
import { CreateStorageLink } from '../Modal/CreateStorageLink';
import { parsePathToContext, truncateText } from '../../utils/common';

export function FileManager(props: { location: v1.Location; path: string; onChangePath: (path: string) => void }) {
  const { colorScheme } = useMantineColorScheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [files, setFiles] = useState<Array<v1.File>>([]);
  const [hasStorageLink, setHasStorageLink] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showNewDirectory, setShowNewDirectory] = useState<boolean>(false);
  const [showRenameFile, setShowRenameFile] = useState<boolean>(false);
  const [showFileTree, setShowFileTree] = useState<boolean>(false);
  const [isMove, setIsMove] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<v1.File>();
  const [openedFile, setOpenedFile] = useState<v1.File>();
  const [showFileInfo, setShowFileInfo] = useState<boolean>(false);
  const [showCreateStorageLink, setShowCreateStorageLink] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setFiles([]);
      setError('');

      const files = orderBy(
        await GetFileList({
          node_id: props.location.node_id,
          location: props.location.name,
          path: props.path,
        }),
        [(v) => (v.type! <= 3 ? 0 : 1), 'name'],
        ['asc', 'asc'],
      );

      const storageLinks = await GetStorageLinks();
      setHasStorageLink(
        !isEmpty(
          storageLinks.find(
            (storageLink) =>
              storageLink.node_id === props.location.node_id || storageLink.location_id === props.location.id,
          ),
        ),
      );

      setFiles(files ?? []);
      setLoading(false);
    } catch (error: any) {
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [props.location.id, props.location.path, props.path]);

  if (loading) {
    return (
      <Center py={300}>
        <Loader color="blue" />
      </Center>
    );
  }

  if (error) {
    return (
      <>
        <Center pt={300}>
          <Text c="red" size="sm">
            {error}
          </Text>
        </Center>

        <Center pt={10}>
          <Button variant="default" onClick={fetchData}>
            重试
          </Button>
        </Center>
      </>
    );
  }

  return (
    <>
      <FileInfo
        opened={showFileInfo}
        location={props.location}
        path={props.path}
        file={openedFile}
        onClose={() => setShowFileInfo(false)}
      />

      <NewDirectory
        opened={showNewDirectory}
        location={props.location}
        path={props.path}
        onClose={() => setShowNewDirectory(false)}
        onCreated={() => {
          setShowNewDirectory(false);
          fetchData();
        }}
      />

      <RenameFile
        opened={showRenameFile}
        location={props.location}
        path={props.path}
        name={selectedFile?.name ?? ''}
        onClose={() => setShowRenameFile(false)}
        onCreated={() => {
          setShowRenameFile(false);
          fetchData();
        }}
      />

      <FileTree
        opened={showFileTree}
        title={isMove ? '移动到' : '复制到'}
        onClose={() => setShowFileTree(false)}
        onConfirm={async (path) => {
          try {
            const destCtx = parsePathToContext(path);
            const srcCtx = parsePathToContext(
              `${props.location.node_id}/${props.location.name}${props.path}/${selectedFile?.name}`,
            );

            if (isEmpty(path) || isEmpty(destCtx.node_id) || isEmpty(destCtx.location)) {
              notifications.show({
                color: 'red',
                message: `不能${isMove ? '移动' : '复制'}到根节点或者存储位置目录`,
              });
              return;
            }

            destCtx.path = `${destCtx.path}/${selectedFile?.name}`;
            setShowFileTree(false);

            isMove ? await MoveFile(srcCtx, destCtx) : await CopyFile(srcCtx, destCtx);
            modals.openConfirmModal({
              title: '提示',
              centered: true,
              children: (
                <Text size="sm">{`文件${isMove ? '移动' : '复制'}中, 请到"传输管理->复制移动"中查看进度。`}</Text>
              ),
              labels: { confirm: '确认', cancel: '取消' },
            });
          } catch (error: any) {
            notifications.show({ color: 'red', message: error });
          }
        }}
      />

      <CreateStorageLink
        opened={showCreateStorageLink}
        nodeId={props.location.node_id}
        locationId={props.location.id}
        onClose={() => setShowCreateStorageLink(false)}
        onCreated={() => {
          setShowCreateStorageLink(false);
          fetchData();
        }}
      />

      <Group justify="space-between" mt={isMacOS() ? 10 : 0} mb={10}>
        <ActionIcon variant="default" size={25} ml={10} onClick={() => props.onChangePath('')}>
          <IoHomeOutline size={15} color={colorScheme === 'light' ? '#000000' : '#ffffff'} />
        </ActionIcon>

        <Box>
          <Button variant="default" onClick={() => setShowNewDirectory(true)}>
            新建文件夹
          </Button>
          <Button
            variant="default"
            mx={10}
            onClick={async () => {
              try {
                await UploadFile({ node_id: props.location.node_id, location: props.location.name, path: props.path });
                modals.openConfirmModal({
                  title: '提示',
                  centered: true,
                  children: <Text size="sm">{'文件上传中, 请到"传输管理->上传列表"中查看进度。'}</Text>,
                  labels: { confirm: '确认', cancel: '取消' },
                });
              } catch (error: any) {
                if (error !== 'cancel') notifications.show({ color: 'red', message: error });
              }
            }}
          >
            上传
          </Button>
          <ActionIcon variant="transparent" size={20} onClick={() => fetchData()}>
            <GrRefresh size={15} color={colorScheme === 'light' ? '#000000' : '#ffffff'} />
          </ActionIcon>
        </Box>
      </Group>

      <Breadcrumbs mb={15}>
        {[...props.path.split('/')].map((part, index) => (
          <Anchor
            key={index}
            onClick={() =>
              props.onChangePath(
                props.path
                  .split('/')
                  .slice(0, index + 1)
                  .join('/'),
              )
            }
          >
            {part}
          </Anchor>
        ))}
      </Breadcrumbs>

      <Divider my={5} />

      {hasStorageLink ? null : (
        <Group h={35} bg="yellow" justify="center">
          <Box>
            <Text c="dark" size="sm" span>
              当前节点未关联任何存储，下载和上传功能无法使用
            </Text>
            <UnstyledButton ml={10} onClick={() => setShowCreateStorageLink(true)}>
              <Text c="dark" size="sm" td="underline">
                新增关联
              </Text>
            </UnstyledButton>
          </Box>
        </Group>
      )}

      <Table striped highlightOnHover withRowBorders={false}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>文件名</Table.Th>
            <Table.Th>大小</Table.Th>
            <Table.Th>修改时间</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {files.map((file, index) => (
            <Table.Tr key={index}>
              <Table.Td
                onClick={() => {
                  setOpenedFile(file);
                  file.type === 3 ? props.onChangePath(`${props.path}/${file.name}`) : setShowFileInfo(true);
                }}
                style={{ cursor: 'pointer' }}
              >
                {file.type === 3 ? <GoFileDirectoryFill size={14} /> : <FaRegFileAlt />}
                <Text span pl={3}>
                  {truncateText(file.name ?? '')}
                </Text>
              </Table.Td>
              <Table.Td>{file.size ? formatBytes(file.size) : '-'}</Table.Td>
              <Table.Td>{new Date(file.modified_at?.seconds! * 1000).toLocaleDateString()}</Table.Td>
              <Table.Td>
                <Menu shadow="md" width={130}>
                  <Menu.Target>
                    <ActionIcon variant="transparent" size={17}>
                      <FiMoreHorizontal color={colorScheme === 'light' ? '#000000' : '#ffffff'} />
                    </ActionIcon>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<CgRename size={14} />}
                      onClick={() => {
                        setSelectedFile(file);
                        setShowRenameFile(true);
                      }}
                    >
                      重命名
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<GoMoveToEnd size={14} />}
                      onClick={() => {
                        setIsMove(true);
                        setSelectedFile(file);
                        setShowFileTree(true);
                      }}
                    >
                      移动到
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<GoCopy size={14} />}
                      onClick={() => {
                        setIsMove(false);
                        setSelectedFile(file);
                        setShowFileTree(true);
                      }}
                    >
                      复制到
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<RiDownloadLine size={14} />}
                      onClick={async () => {
                        try {
                          await DownloadFile({
                            node_id: props.location.node_id,
                            location: props.location.name,
                            path: `${props.path}/${file.name}`,
                          });

                          modals.openConfirmModal({
                            title: '提示',
                            centered: true,
                            children: <Text size="sm">{'文件下载中, 请到"传输管理->下载列表"中查看进度。'}</Text>,
                            labels: { confirm: '确认', cancel: '取消' },
                          });
                        } catch (error: any) {
                          if (error !== 'cancel') notifications.show({ color: 'red', message: error });
                        }
                      }}
                    >
                      下载
                    </Menu.Item>
                    <Menu.Item
                      color="red"
                      leftSection={<RiDeleteBinLine size={14} />}
                      onClick={() =>
                        modals.openConfirmModal({
                          title: '提示',
                          centered: true,
                          children: <Text size="sm">确认要删除文件吗?</Text>,
                          labels: { confirm: '删除', cancel: '取消' },
                          confirmProps: { color: 'red' },
                          onConfirm: async () => {
                            try {
                              await RemoveFile({
                                node_id: props.location.node_id,
                                location: props.location.name,
                                path: `${props.path}/${file.name}`,
                              });

                              notifications.show({
                                color: 'green',
                                message: (
                                  <Text size="sm">
                                    删除文件 <Code>{file.name}</Code> 成功
                                  </Text>
                                ),
                              });
                              fetchData();
                            } catch (error: any) {
                              notifications.show({ color: 'red', message: error });
                            }
                          },
                        })
                      }
                    >
                      删除
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </>
  );
}
