import { isEmpty } from 'lodash-es';
import { ActionIcon, Center, Group, Loader, Table, Text, Tooltip, useMantineColorScheme } from '@mantine/core';
import { models } from '../../../../wailsjs/go/models';
import { DeleteCopy, GetCopyList } from '../../../../wailsjs/go/services/DatabaseService';
import { useEffect, useState } from 'react';
import { RiDeleteBinLine } from 'react-icons/ri';
import { GrRefresh } from 'react-icons/gr';

export function Copy(props: { opened: boolean }) {
  const { colorScheme } = useMantineColorScheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [copyList, setCopyList] = useState<Array<models.Copy>>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setCopyList(await GetCopyList());
      setLoading(false);
    } catch (e) {
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

  if (isEmpty(copyList)) {
    return (
      <Center mt={150}>
        <Text size="lg">没复制任务</Text>
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
            <Table.Th>路径</Table.Th>
            <Table.Th>进度</Table.Th>
            <Table.Th>状态</Table.Th>
            <Table.Th>位置</Table.Th>
            <Table.Th>节点</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {copyList.map((copy, _) => (
            <Table.Tr key={copy.ID}>
              <Table.Td>
                <Tooltip label={copy.Path}>
                  <Text lineClamp={1} size="sm">
                    {copy.Path}
                  </Text>
                </Tooltip>
              </Table.Td>
              <Table.Td>{copy.Progress}%</Table.Td>
              <Table.Td>{copy.Status}</Table.Td>
              <Table.Td>
                <Tooltip label={copy.Location}>
                  <Text w={80} lineClamp={1} size="sm">
                    {copy.Location}
                  </Text>
                </Tooltip>
              </Table.Td>
              <Table.Td>{copy.NodeId}</Table.Td>
              <Table.Td>
                <ActionIcon
                  variant="transparent"
                  size={17}
                  onClick={async () => {
                    await DeleteCopy(copy.ID);
                    fetchData();
                  }}
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
