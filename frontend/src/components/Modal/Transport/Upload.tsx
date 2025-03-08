import { isEmpty } from 'lodash-es';
import { ActionIcon, Center, Group, Loader, Table, Text, Tooltip, useMantineColorScheme } from '@mantine/core';
import { models } from '../../../../wailsjs/go/models';
import { DeleteUpload, GetUploadList } from '../../../../wailsjs/go/services/DatabaseService';
import { useEffect, useState } from 'react';
import { RiDeleteBinLine } from 'react-icons/ri';
import { GrRefresh } from 'react-icons/gr';

export function Upload(props: { opened: boolean }) {
  const { colorScheme } = useMantineColorScheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadList, setUploadList] = useState<Array<models.Upload>>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setUploadList(await GetUploadList());
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

  if (isEmpty(uploadList)) {
    return (
      <Center mt={150}>
        <Text size="lg">没有上传任务</Text>
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
          {uploadList.map((upload, _) => (
            <Table.Tr key={upload.ID}>
              <Table.Td>
                <Tooltip label={upload.Path}>
                  <Text lineClamp={1} size="sm">
                    {upload.Path}
                  </Text>
                </Tooltip>
              </Table.Td>
              <Table.Td>{upload.Progress}%</Table.Td>
              <Table.Td>{upload.Status}</Table.Td>
              <Table.Td>
                <Tooltip label={upload.Location}>
                  <Text w={80} lineClamp={1} size="sm">
                    {upload.Location}
                  </Text>
                </Tooltip>
              </Table.Td>
              <Table.Td>{upload.NodeId}</Table.Td>
              <Table.Td>
                <ActionIcon
                  variant="transparent"
                  size={17}
                  onClick={async () => {
                    await DeleteUpload(upload.ID);
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
