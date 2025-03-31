import { useEffect, useState } from 'react';
import { Box, Button, Code, Group, Input, Modal, Text } from '@mantine/core';
import { v1 } from '../../../wailsjs/go/models';
import { MoveFile } from '../../../wailsjs/go/services/FileService';
import { isEmpty } from 'lodash-es';
import { notifications } from '@mantine/notifications';

export function RenameFile(props: {
  opened: boolean;
  location: v1.Location;
  path: string;
  name: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [value, setValue] = useState(props.name);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  useEffect(() => {
    setValue(props.name);
  }, [props.name]);

  return (
    <Modal opened={props.opened} onClose={props.onClose} title="重命名文件" size="auto" centered>
      <Box miw={300} mih={100}>
        <Input value={value} onChange={(event) => setValue(event.currentTarget.value)} mt={10} />

        <Group justify="flex-end">
          <Button
            mt={20}
            loading={saveLoading}
            loaderProps={{ type: 'dots' }}
            onClick={async () => {
              if (isEmpty(value)) {
                notifications.show({ color: 'red', message: '名称不能为空' });
                return;
              }

              if (value === props.name) {
                props.onClose();
                return;
              }

              try {
                setSaveLoading(true);

                await MoveFile(
                  {
                    node_id: props.location.node_id,
                    location: props.location.name,
                    path: `${props.path}/${props.name}`,
                  },
                  {
                    node_id: props.location.node_id,
                    location: props.location.name,
                    path: `${props.path}/${value}`,
                  },
                );

                await new Promise((resolve) => setTimeout(resolve, 500));
                notifications.show({
                  color: 'green',
                  message: (
                    <Text size="sm">
                      重命名文件 <Code>{props.name}</Code> 成功
                    </Text>
                  ),
                });
                setSaveLoading(false);
                props.onCreated();
              } catch (error: any) {
                setSaveLoading(false);
                notifications.show({ color: 'red', message: error });
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
