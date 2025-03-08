import { useState } from 'react';
import { Box, Button, Group, Input, Modal } from '@mantine/core';
import { v1 } from '../../../wailsjs/go/models';
import { Mkdir } from '../../../wailsjs/go/services/FileService';
import { isEmpty } from 'lodash-es';
import { notifications } from '@mantine/notifications';

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
        <Input placeholder="请输入文件夹名称" onChange={(event) => setValue(event.currentTarget.value)} mt={10} />
        <Group justify="flex-end">
          <Button
            variant="default"
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
                await Mkdir({
                  node_id: props.location.node_id,
                  location: props.location.name,
                  path: `${props.path}/${value}`,
                });

                setSaveLoading(false);
                props.onCreated();
              } catch (error: any) {
                setSaveLoading(false);
                notifications.show({ color: 'red', message: error });
              }
            }}
          >
            新建文件夹
          </Button>
        </Group>
      </Box>
    </Modal>
  );
}
