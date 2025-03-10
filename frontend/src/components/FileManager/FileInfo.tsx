import { useState } from 'react';
import { Box, Button, Group, Modal, Table, Text } from '@mantine/core';
import { v1 } from '../../../wailsjs/go/models';
import { formatBytes } from 'bytes-formatter';
import { DownloadFile, PlayVideo } from '../../../wailsjs/go/services/FileService';
import { isVideo } from '../../utils/common';
import { notifications } from '@mantine/notifications';

export function FileInfo(props: {
  opened: boolean;
  location: v1.Location;
  path: string;
  file?: v1.File;
  onClose: () => void;
}) {
  const [playLoading, setPlayLoading] = useState<boolean>(false);

  return (
    <Modal opened={props.opened} onClose={props.onClose} title="文件信息" size="auto" centered>
      <Box miw={400} mih={100}>
        <Table variant="vertical" layout="auto" withRowBorders={false}>
          <Table.Tbody>
            {[
              { label: '文件名', value: props.file?.name },
              { label: '文件大小', value: props.file?.size ? formatBytes(props.file.size) : '-' },
              { label: '修改时间', value: new Date(props.file?.modified_at?.seconds! * 1000).toLocaleDateString() },
            ].map(({ label, value }) => (
              <Table.Tr key={label}>
                <Table.Th w={100}>
                  <Text>{label}</Text>
                </Table.Th>
                <Table.Td>{value || '-'}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Group justify="flex-end" mt={20}>
          <Button
            variant="default"
            onClick={async () => {
              await DownloadFile({
                node_id: props.location.node_id,
                location: props.location.name,
                path: `${props.path}/${props.file?.name}`,
              });
            }}
          >
            下载文件
          </Button>

          {isVideo(props.file?.name ?? '') ? (
            <Button
              variant="default"
              loading={playLoading}
              loaderProps={{ type: 'dots' }}
              onClick={async () => {
                setPlayLoading(true);

                try {
                  await PlayVideo({
                    node_id: props.location.node_id,
                    location: props.location.name,
                    path: `${props.path}/${props.file?.name}`,
                  });

                  setPlayLoading(false);
                } catch (error: any) {
                  setPlayLoading(false);
                  notifications.show({ color: 'red', message: <Text lineClamp={8}>{error}</Text> });
                }

                props.onClose();
              }}
            >
              直接播放
            </Button>
          ) : null}
        </Group>
      </Box>
    </Modal>
  );
}
