import {
  ActionIcon,
  Button,
  Center,
  Code,
  Group,
  Loader,
  Menu,
  Table,
  Text,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { RiDeleteBinLine, RiEditLine, RiPlayCircleLine, RiStopCircleLine } from 'react-icons/ri';
import { GrRefresh } from 'react-icons/gr';
import { FiMoreHorizontal } from 'react-icons/fi';
import { GetNodes } from '../../../../wailsjs/go/services/NodeService';
import {
  GetFileSyncList,
  AddFileSync,
  StartFileSync,
  StopFileSync,
  RemoveFileSync,
} from '../../../../wailsjs/go/services/FileSyncService';
import { isEmpty } from 'lodash-es';
import { v1 } from '../../../../wailsjs/go/models';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { CreateFileSync } from '../CreateFileSync';

function formatFileSyncStatus(status?: number): string {
  switch (status) {
    case 0:
      return '暂未同步';
    case 1:
      return '同步中...';
    case 2:
      return '同步成功';
    case 3:
      return '同步失败';
    default:
      return '未知';
  }
}

function formatFileSyncStatusTooltip(sync: v1.Sync): string {
  switch (sync.status) {
    case 2:
      return `上次同步时间: ${new Date(sync.config?.last_synced_at?.seconds! * 1000).toLocaleString()}`;
    case 3:
      return `同步失败: ${sync.config?.log}`;
    default:
      return '';
  }
}

function formatSecondsToHours(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const chineseNumbers = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  return `${chineseNumbers[hours]}小时`;
}

export function FileSync(props: { opened: boolean }) {
  const { colorScheme } = useMantineColorScheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showCreateFileSync, setShowCreateFileSync] = useState<boolean>(false);
  const [showFileSyncInfo, setShowFileSyncInfo] = useState<boolean>(false);
  const [selectedFileSync, setSelectedFileSync] = useState<v1.Sync>();
  const [fileSyncList, setFileSyncList] = useState<
    Array<
      v1.Sync & {
        srcNode?: v1.Node;
        destNode?: v1.Node;
      }
    >
  >([]);

  const fetchData = async () => {
    try {
      setError('');
      setLoading(true);

      const nodeList = await GetNodes();
      const fileSyncList = ((await GetFileSyncList()) ?? []).map((fileSync) => ({
        ...fileSync,
        srcNode: nodeList.find((node) => node.id === fileSync.src_node_id),
        destNode: nodeList.find((node) => node.id === fileSync.dest_node_id),
      }));

      setFileSyncList(fileSyncList as any);
      setLoading(false);
    } catch (error: any) {
      setError(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (props.opened) fetchData();
  }, [props.opened]);

  if (loading) {
    return (
      <Center mt={150}>
        <Loader color="blue" />
      </Center>
    );
  }

  if (error) {
    return (
      <>
        <Center mt={150}>
          <Text color="red" size="sm">
            {error}
          </Text>
        </Center>

        <Center mt={5}>
          <Button variant="default" onClick={fetchData}>
            重试
          </Button>
        </Center>
      </>
    );
  }

  return (
    <>
      <CreateFileSync
        opened={showCreateFileSync}
        sync={selectedFileSync}
        onClose={() => setShowCreateFileSync(false)}
        onCreated={() => {
          setShowCreateFileSync(false);
          fetchData();
        }}
      />

      <Group justify="end" mt={15} mb={5}>
        <Button
          p={10}
          onClick={() => {
            setSelectedFileSync(undefined);
            setShowCreateFileSync(true);
          }}
        >
          新增同步
        </Button>

        <ActionIcon variant="transparent" size={20} onClick={() => fetchData()}>
          <GrRefresh size={15} color={colorScheme === 'light' ? '#000000' : '#ffffff'} />
        </ActionIcon>
      </Group>

      {isEmpty(fileSyncList) ? (
        <Center mt={150}>
          <Text>未找到文件同步信息</Text>
        </Center>
      ) : (
        <Table striped highlightOnHover withRowBorders={false}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>名称</Table.Th>
              <Table.Th>源节点</Table.Th>
              <Table.Th>目标节点</Table.Th>
              <Table.Th>开启状态</Table.Th>
              <Table.Th>双向同步</Table.Th>
              <Table.Th>扫描间隔</Table.Th>
              <Table.Th>状态</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {fileSyncList.map((sync, _) => (
              <Table.Tr key={sync.id}>
                <Table.Td>{sync.name}</Table.Td>
                <Table.Td>
                  <Tooltip
                    label={`${sync.src_context?.node_id}/${sync.src_context?.location}${sync.src_context?.path}`}
                  >
                    <Text size="sm">{sync.srcNode?.name}</Text>
                  </Tooltip>
                </Table.Td>
                <Table.Td>
                  <Tooltip
                    label={`${sync.dest_context?.node_id}/${sync.dest_context?.location}${sync.dest_context?.path}`}
                  >
                    <Text size="sm">{sync.destNode?.name}</Text>
                  </Tooltip>
                </Table.Td>
                <Table.Td>{sync.enabled ? '开启' : '停止'}</Table.Td>
                <Table.Td>{sync.config?.duplex ? '开启' : '关闭'}</Table.Td>
                <Table.Td>{formatSecondsToHours(sync.config?.interval ?? 0)}</Table.Td>
                <Table.Td>
                  {isEmpty(formatFileSyncStatusTooltip(sync)) ? (
                    <Text size="sm">{formatFileSyncStatus(sync.status)}</Text>
                  ) : (
                    <Tooltip label={formatFileSyncStatusTooltip(sync)}>
                      <Text size="sm">{formatFileSyncStatus(sync.status)}</Text>
                    </Tooltip>
                  )}
                </Table.Td>
                <Table.Td>
                  <Menu shadow="md" width={130}>
                    <Menu.Target>
                      <ActionIcon variant="transparent" size={17}>
                        <FiMoreHorizontal color={colorScheme === 'light' ? '#000000' : '#ffffff'} />
                      </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<RiPlayCircleLine size={14} />}
                        onClick={async () => {
                          modals.openConfirmModal({
                            title: '提示',
                            centered: true,
                            children: (
                              <Text size="sm">
                                确认要开启 <Code>{sync.name}</Code> 文件同步吗?
                              </Text>
                            ),
                            labels: { confirm: '开启', cancel: '取消' },
                            onConfirm: async () => {
                              try {
                                sync.enabled = true;
                                await AddFileSync(sync);
                                await StartFileSync(sync);

                                await fetchData();
                                notifications.show({ color: 'green', message: '文件同步开启成功' });
                              } catch (error: any) {
                                notifications.show({ color: 'red', message: error });
                              }
                            },
                          });
                        }}
                      >
                        开启同步
                      </Menu.Item>

                      <Menu.Item
                        color="red"
                        leftSection={<RiStopCircleLine size={14} />}
                        onClick={() =>
                          modals.openConfirmModal({
                            title: '提示',
                            centered: true,
                            children: (
                              <Text size="sm">
                                确认要停止 <Code>{sync.name}</Code> 文件同步吗?
                              </Text>
                            ),
                            labels: { confirm: '停止', cancel: '取消' },
                            confirmProps: { color: 'red' },
                            onConfirm: async () => {
                              try {
                                sync.enabled = false;
                                await AddFileSync(sync);
                                await StopFileSync(sync);

                                await fetchData();
                                notifications.show({ color: 'green', message: '文件同步关闭成功' });
                              } catch (error: any) {
                                notifications.show({ color: 'red', message: error });
                              }
                            },
                          })
                        }
                      >
                        停止同步
                      </Menu.Item>

                      <Menu.Divider />

                      <Menu.Item
                        leftSection={<RiEditLine size={14} />}
                        onClick={() => {
                          setSelectedFileSync(sync);
                          setShowCreateFileSync(true);
                        }}
                      >
                        编辑
                      </Menu.Item>

                      <Menu.Item
                        color="red"
                        leftSection={<RiDeleteBinLine size={14} />}
                        onClick={() =>
                          modals.openConfirmModal({
                            title: '提示',
                            centered: true,
                            children: (
                              <Text size="sm">
                                确认要删除 <Code>{sync.name}</Code> 文件同步吗?
                              </Text>
                            ),
                            labels: { confirm: '删除', cancel: '取消' },
                            confirmProps: { color: 'red' },
                            onConfirm: async () => {
                              try {
                                await StopFileSync(sync);
                                await RemoveFileSync(sync.id!);
                                await fetchData();
                                notifications.show({ color: 'green', message: '文件同步删除成功' });
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
      )}
    </>
  );
}
