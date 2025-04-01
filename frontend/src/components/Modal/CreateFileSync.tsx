import { Box, Button, Code, Group, Modal, Select, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { isEmpty, merge } from 'lodash-es';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { parsePathToContext } from '../../utils/common';
import { FileTree } from './FileTree';
import { modals } from '@mantine/modals';
import { FileSyncService, FileService } from '../../../bindings/github.com/pixelfs/pixelfs-desktop/services';
import * as v1 from '../../../bindings/github.com/pixelfs/pixelfs/gen/pixelfs/v1';

export function CreateFileSync(props: { opened: boolean; onClose: () => void; onCreated: () => void; sync?: v1.Sync }) {
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [showFileTree, setShowFileTree] = useState<boolean>(false);
  const [selected, setSelected] = useState<'src' | 'dest'>('src');

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      src: '',
      dest: '',
      enabled: 'on',
      duplex: 'off',
      interval: '3600',
    },

    validate: {
      name: (value) => (!isEmpty(value) ? null : '名称不能为空'),
      src: (value) => {
        if (isEmpty(value)) return '源目录不能为空';

        const ctx = parsePathToContext(value);
        if (isEmpty(ctx.node_id) || isEmpty(ctx.location)) {
          return '节点或者存储位置不能为空';
        }
      },
      dest: (value) => {
        if (isEmpty(value)) return '目标目录不能为空';

        const ctx = parsePathToContext(value);
        if (isEmpty(ctx.node_id) || isEmpty(ctx.location)) {
          return '节点或者存储位置不能为空';
        }
      },
    },
  });

  useEffect(() => {
    const init = async () => {
      if (props.sync) {
        const srcCtx = props.sync.src_context;
        const destCtx = props.sync.dest_context;

        form.setValues({
          name: props.sync.name,
          src: `${srcCtx?.node_id}/${srcCtx?.location}${srcCtx?.path}`,
          dest: `${destCtx?.node_id}/${destCtx?.location}${destCtx?.path}`,
          enabled: props.sync.enabled ? 'on' : 'off',
          duplex: props.sync.config?.duplex ? 'on' : 'off',
          interval: props.sync.config?.interval?.toString(),
        });
      } else {
        form.reset();
      }
    };

    if (props.opened) init();
  }, [props.opened, props.sync]);

  return (
    <>
      <FileTree
        opened={showFileTree}
        title={selected === 'src' ? '选择源目录' : '选择目标目录'}
        onClose={() => setShowFileTree(false)}
        onConfirm={(path) => {
          const context = parsePathToContext(path);

          if (isEmpty(path) || isEmpty(context.node_id) || isEmpty(context.location)) {
            notifications.show({ color: 'red', message: `文件同步目录不能选择根节点` });
            return;
          }

          setShowFileTree(false);
          if (selected === 'src') form.setValues({ src: path });
          if (selected === 'dest') form.setValues({ dest: path });
        }}
      />

      <Modal
        opened={props.opened}
        onClose={props.onClose}
        title={`${props.sync ? '编辑' : '创建'}文件同步`}
        size="auto"
        centered
      >
        <Box w={400} mih={500}>
          <form
            onSubmit={form.onSubmit(async (values) =>
              modals.openConfirmModal({
                title: '提示',
                centered: true,
                children: (
                  <>
                    <Text size="sm">
                      你将要保存 <Code>{values.name}</Code> 文件同步，确认保存吗?
                    </Text>
                  </>
                ),
                labels: { confirm: '确认', cancel: '取消' },
                onConfirm: async () => {
                  try {
                    setSaveLoading(true);

                    const srcFile = await FileService.StatFile(parsePathToContext(values.src));
                    if (!(srcFile?.type === 2 || srcFile?.type === 3)) {
                      notifications.show({
                        color: 'red',
                        message: (
                          <Text size="sm">
                            <Code>{values.src}</Code> 不是目录
                          </Text>
                        ),
                      });
                      return;
                    }

                    const destFile = await FileService.StatFile(parsePathToContext(values.dest));
                    if (!(destFile?.type === 2 || destFile?.type === 3)) {
                      notifications.show({
                        color: 'red',
                        message: (
                          <Text size="sm">
                            <Code>{values.src}</Code> 不是目录
                          </Text>
                        ),
                      });
                      return;
                    }

                    const sync = await FileSyncService.AddFileSync(
                      v1.Sync.createFrom({
                        id: props.sync?.id,
                        name: values.name,
                        enabled: values.enabled === 'on',
                        src_context: parsePathToContext(values.src),
                        dest_context: parsePathToContext(values.dest),
                        config: v1.SyncConfig.createFrom(
                          merge(props.sync?.config ?? {}, {
                            duplex: values.duplex === 'on',
                            interval: parseInt(values.interval),
                          }),
                        ),
                      }),
                    );

                    await FileSyncService.StartFileSync(sync);
                    notifications.show({
                      color: 'green',
                      message: (
                        <Text size="sm">
                          文件同步 <Code>{values.name}</Code> 创建成功
                        </Text>
                      ),
                    });

                    props.onCreated();
                    setSaveLoading(false);
                  } catch (error: any) {
                    setSaveLoading(false);
                    notifications.show({
                      color: 'red',
                      message: <Text size="sm">请检查填写的信息是否正确，{error.message}</Text>,
                    });
                  }
                },
              }),
            )}
          >
            <TextInput
              withAsterisk
              label="名称"
              description="文件同步的名称，用于标识。"
              key={form.key('name')}
              {...form.getInputProps('name')}
            />

            <Group justify="space-between">
              <TextInput
                mt="md"
                w={330}
                withAsterisk
                label="源目录"
                description={
                  <>
                    <Text size="xs">文件同步的源目录，指定需要同步的原始文件目录。</Text>
                    <Text size="xs">
                      eg: <Text span fw={700}>{`<node>/<location>/path/to。`}</Text>
                    </Text>
                  </>
                }
                key={form.key('src')}
                {...form.getInputProps('src')}
              />
              <Button
                mt={!isEmpty(form.getInputProps('src').error) ? 58 : 77}
                px={12}
                variant="default"
                onClick={() => {
                  setSelected('src');
                  setShowFileTree(true);
                }}
              >
                选择
              </Button>
            </Group>

            <Group justify="space-between">
              <TextInput
                mt="md"
                w={330}
                withAsterisk
                label="目标目录"
                description={
                  <>
                    <Text size="xs">文件同步的目标目录，指定需要同步到的远端目录。</Text>
                    <Text size="xs">
                      eg: <Text span fw={700}>{`<node>/<location>/path/to。`}</Text>
                    </Text>
                  </>
                }
                key={form.key('dest')}
                {...form.getInputProps('dest')}
              />
              <Button
                mt={!isEmpty(form.getInputProps('dest').error) ? 58 : 77}
                px={12}
                variant="default"
                onClick={() => {
                  setSelected('dest');
                  setShowFileTree(true);
                }}
              >
                选择
              </Button>
            </Group>

            <Select
              mt="md"
              label="双向同步"
              description="是否开启双向同步，开启后源目录和目标目录之间的文件变更将自动相互同步。"
              data={[
                { label: '关闭', value: 'off' },
                { label: '开启', value: 'on' },
              ]}
              allowDeselect={false}
              key={form.key('duplex')}
              {...form.getInputProps('duplex')}
            />

            <Select
              mt="md"
              label="扫描间隔"
              description="设置文件同步的扫描间隔时间，用于定期检查文件变更并触发同步。"
              data={[
                { label: '一小时', value: '3600' },
                { label: '二小时', value: '7200' },
                { label: '三小时', value: '10800' },
                { label: '四小时', value: '14400' },
                { label: '五小时', value: '18000' },
                { label: '六小时', value: '21600' },
              ]}
              allowDeselect={false}
              key={form.key('interval')}
              {...form.getInputProps('interval')}
            />

            <Group justify="flex-end" mt="md">
              <Button type="submit" loading={saveLoading} loaderProps={{ type: 'dots' }}>
                保存
              </Button>
            </Group>
          </form>
        </Box>
      </Modal>
    </>
  );
}
