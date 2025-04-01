import { useState } from 'react';
import { Box, Button, Code, Group, Input, Modal, Text } from '@mantine/core';
import { isEmpty } from 'lodash-es';
import { notifications } from '@mantine/notifications';
import { FileService } from '../../../bindings/github.com/pixelfs/pixelfs-desktop/services';
import * as v1 from '../../../bindings/github.com/pixelfs/pixelfs/gen/pixelfs/v1';

export function NewDirectory(props: {
  opened: boolean;
  location: v1.Location;
  path: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [value, setValue] = useState('');
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  return (
    <Modal opened={props.opened} onClose={props.onClose} title="新建文件夹" size="auto" centered>
      <Box miw={300} mih={100}>
        <Input
          placeholder="请输入文件夹名称"
          data-autofocus
          onChange={(event) => setValue(event.currentTarget.value)}
          mt={10}
        />
        <Group justify="flex-end">
          <Button
            mt={20}
            loading={saveLoading}
            loaderProps={{ type: 'dots' }}
            onClick={async () => {
              if (isEmpty(value)) {
                notifications.show({ color: 'red', message: '文件夹名称不能为空' });
                return;
              }

              try {
                setSaveLoading(true);
                await FileService.Mkdir({
                  node_id: props.location.node_id,
                  location: props.location.name,
                  path: `${props.path}/${value}`,
                });

                notifications.show({
                  color: 'green',
                  message: (
                    <Text size="sm">
                      文件夹 <Code>{value}</Code> 创建成功
                    </Text>
                  ),
                });
                setSaveLoading(false);
                props.onCreated();
              } catch (error: any) {
                setSaveLoading(false);
                notifications.show({ color: 'red', message: error.message });
              }
            }}
          >
            确认
          </Button>
        </Group>
      </Box>
    </Modal>
  );
}
