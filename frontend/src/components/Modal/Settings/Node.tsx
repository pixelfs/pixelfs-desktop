import { isEmpty } from 'lodash-es';
import { ActionIcon, Button, Center, Code, Group, Loader, Table, Text, useMantineColorScheme } from '@mantine/core';
import { useEffect, useState } from 'react';
import { RiDeleteBinLine } from 'react-icons/ri';
import { GrRefresh } from 'react-icons/gr';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { NodeService } from '../../../../bindings/github.com/pixelfs/pixelfs-desktop/services';
import * as v1 from '../../../../bindings/github.com/pixelfs/pixelfs/gen/pixelfs/v1';

export function Node(props: { opened: boolean }) {
  const { colorScheme } = useMantineColorScheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [nodeList, setNodeList] = useState<Array<v1.Node | null>>([]);

  const fetchData = async () => {
    try {
      setError('');
      setLoading(true);

      setNodeList(await NodeService.GetNodes());
      setLoading(false);
    } catch (error: any) {
      setError(error.message);
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
          <Text c="red" size="sm">
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

  if (isEmpty(nodeList)) {
    return (
      <Center mt={150}>
        <Text size="lg">未找到节点</Text>
      </Center>
    );
  }

  return (
    <>
      <Group justify="end" mt={15}>
        <ActionIcon variant="transparent" size={20} onClick={() => fetchData()}>
          <GrRefresh size={15} color={colorScheme === 'light' ? '#000000' : '#ffffff'} />
        </ActionIcon>
      </Group>

      <Table striped highlightOnHover withRowBorders={false}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>名称</Table.Th>
            <Table.Th>状态</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {nodeList.map((node, _) => (
            <Table.Tr key={node?.id}>
              <Table.Td>{node?.id}</Table.Td>
              <Table.Td>{node?.name}</Table.Td>
              <Table.Td>{node?.status === 1 ? '在线' : '离线'}</Table.Td>
              <Table.Td>
                <ActionIcon
                  variant="transparent"
                  size={17}
                  onClick={() =>
                    modals.openConfirmModal({
                      title: '提示',
                      centered: true,
                      children: <Text size="sm">确认要删除节点吗?</Text>,
                      labels: { confirm: '删除', cancel: '取消' },
                      confirmProps: { color: 'red' },
                      onConfirm: async () => {
                        if (node?.status === 1) {
                          notifications.show({ color: 'red', message: '节点在线时无法删除' });
                          return;
                        }

                        try {
                          await NodeService.RemoveNode(node?.id!);
                          notifications.show({
                            color: 'green',
                            message: (
                              <Text size="sm">
                                节点 <Code>{node?.name}</Code> 删除成功
                              </Text>
                            ),
                          });
                          fetchData();
                        } catch (error: any) {
                          notifications.show({ color: 'red', message: error.message });
                        }
                      },
                    })
                  }
                >
                  <RiDeleteBinLine color="red" />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </>
  );
}
