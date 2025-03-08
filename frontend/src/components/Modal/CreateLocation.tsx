import { Box, Button, Group, Modal, NativeSelect, NumberInput, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { isEmpty } from 'lodash-es';
import { useEffect, useState } from 'react';
import { v1 } from '../../../wailsjs/go/models';
import { AddLocation } from '../../../wailsjs/go/services/LocationService';
import { notifications } from '@mantine/notifications';
import { FormatBytes } from '../../../wailsjs/go/services/SystemService';

export function CreateLocation(props: {
  opened: boolean;
  nodeList: v1.Node[];
  nodeId: string;
  location: v1.Location;
  isEdit: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [nodeId, setNodeId] = useState<string>(props.nodeId);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      path: '',
      blockSize: '4MB',
      blockDuration: 20,
    },

    validate: {
      name: (value) => (!isEmpty(value) ? null : '名称不能为空'),
      path: (value) => (!isEmpty(value) ? null : '路径不能为空'),
      blockDuration: (value) => (value > 0 ? null : '文件块时间必须大于 0'),
    },
  });

  useEffect(() => setNodeId(props.nodeId), [props.nodeId]);

  useEffect(() => {
    const init = async () => {
      form.setValues({
        name: props.location.name ?? '',
        path: props.location.path ?? '',
        blockSize: props.location.block_size ? await FormatBytes(props.location.block_size) : '4MB',
        blockDuration: props.location.block_duration ?? 20,
      });
    };

    if (props.opened) init();
  }, [props.opened]);

  return (
    <Modal
      opened={props.opened}
      onClose={props.onClose}
      title={`${props.isEdit ? '编辑' : '创建'}存储位置`}
      size="auto"
      centered
    >
      <Box w={400} mih={100}>
        <form
          onSubmit={form.onSubmit(async (values) => {
            try {
              setSaveLoading(true);
              await AddLocation(nodeId, values.name, values.path, values.blockSize, values.blockDuration);
              props.onCreated();
              setSaveLoading(false);
            } catch (error: any) {
              setSaveLoading(false);
              notifications.show({ color: 'red', message: error });
            }
          })}
        >
          <NativeSelect
            withAsterisk
            label="节点"
            description="选择需要添加存储位置的节点。"
            disabled={props.isEdit}
            value={nodeId}
            onChange={(event) => setNodeId(event.currentTarget.value)}
            data={props.nodeList.map((node) => node.id!)}
          />

          <TextInput
            mt="md"
            withAsterisk
            label="名称"
            description="存储位置的名称，在同一个节点下，名称不能重复。"
            disabled={props.isEdit}
            key={form.key('name')}
            {...form.getInputProps('name')}
          />

          <TextInput
            mt="md"
            withAsterisk
            label="路径"
            description="存储位置的路径，需要是对应的节点中存在的目录。"
            key={form.key('path')}
            {...form.getInputProps('path')}
          />

          <TextInput
            mt="md"
            label="文件块大小"
            description="每个块的大小，在传输文件时切割的文件块大小，默认值为 4MB。"
            placeholder="4MB"
            key={form.key('blockSize')}
            {...form.getInputProps('blockSize')}
          />

          <NumberInput
            mt="md"
            label="文件块时间"
            description="每个块分隔的时间，在生成 m3u8 文件时视频文件切割的时间，默认值为 20s。"
            placeholder="20"
            min={5}
            max={300}
            key={form.key('blockDuration')}
            {...form.getInputProps('blockDuration')}
          />

          <Group justify="flex-end" mt="md">
            <Button type="submit" loading={saveLoading} loaderProps={{ type: 'dots' }}>
              保存
            </Button>
          </Group>
        </form>
      </Box>
    </Modal>
  );
}
