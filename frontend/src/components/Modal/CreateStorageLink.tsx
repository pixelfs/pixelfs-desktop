import {
  Box,
  Button,
  Center,
  Divider,
  Group,
  Loader,
  Modal,
  NativeSelect,
  Radio,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { isEmpty } from 'lodash-es';
import { useEffect, useState } from 'react';
import { CreateStorage } from './CreateStorage';
import { notifications } from '@mantine/notifications';
import {
  LocationService,
  StorageService,
  UtilService,
  NodeService,
} from '../../../bindings/github.com/pixelfs/pixelfs-desktop/services';
import * as v1 from '../../../bindings/github.com/pixelfs/pixelfs/gen/pixelfs/v1';

export function CreateStorageLink(props: {
  opened: boolean;
  onClose: () => void;
  onCreated: () => void;
  nodeId?: string;
  locationId?: string;
  storageLink?: v1.StorageLink;
}) {
  const [loading, setLoading] = useState<boolean>(true);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [nodeList, setNodeList] = useState<Array<v1.Node>>([]);
  const [storageList, setStorageList] = useState<Array<v1.Storage>>([]);
  const [locationList, setLocationList] = useState<Array<v1.Location>>([]);
  const [showCreateStorage, setShowCreateStorage] = useState<boolean>(false);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      storage: '',
      node: '',
      location: '',
      nodeOrLocation: 'node',
      limitSize: '128MB',
    },

    validate: {
      storage: (value) => (!isEmpty(value) ? null : '存储不能为空'),
      nodeOrLocation: (value) => (!isEmpty(value) ? null : '未选择节点或者存储'),
      limitSize: (value) => (!isEmpty(value) ? null : '存储大小不能为空'),
    },
  });

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const nodeList = (await NodeService.GetNodes()).filter((n) => !!n);
        const storageList = (await StorageService.GetStorages()).filter((n) => !!n);
        const locationList = (await LocationService.GetLocations()).filter((n) => !!n);

        if (props.storageLink) {
          form.setValues({
            storage: props.storageLink.storage_id,
            node: props.storageLink.node_id,
            location: props.storageLink.location_id,
            limitSize: await UtilService.FormatBytes(props.storageLink.limit_size!),
            nodeOrLocation: props.storageLink.node_id ? 'node' : 'location',
          });
        } else {
          form.setValues({
            storage: isEmpty(storageList) ? '' : storageList[0].id,
            node: isEmpty(nodeList) ? '' : nodeList[0].id,
            location: isEmpty(locationList) ? '' : locationList[0].id,
            nodeOrLocation: 'node',
            limitSize: '128MB',
          });
        }

        if (props.nodeId) form.setValues({ node: props.nodeId });
        if (props.locationId) form.setValues({ location: props.locationId });

        setNodeList(nodeList);
        setStorageList(storageList);
        setLocationList(locationList);
        setLoading(false);
      } catch (error: any) {
        setLoading(false);
        notifications.show({ color: 'red', message: error.message });
      }
    };

    if (props.opened) init();
  }, [props.opened, props.storageLink, props.nodeId, props.locationId]);

  return (
    <Modal
      opened={props.opened}
      onClose={props.onClose}
      title={`${props.storageLink ? '编辑' : '创建'}存储关联`}
      size="auto"
      centered
    >
      <CreateStorage
        opened={showCreateStorage}
        onClose={() => setShowCreateStorage(false)}
        onCreated={async () => {
          setShowCreateStorage(false);
          setStorageList((await StorageService.GetStorages()).filter((s) => !!s));
        }}
      />

      <Box w={450} mih={560}>
        {loading ? (
          <Center pt={230}>
            <Loader color="blue" />
          </Center>
        ) : (
          <form
            onSubmit={form.onSubmit(async (values) => {
              try {
                setSaveLoading(true);
                await StorageService.AddStorageLink({
                  storage_id: values.storage,
                  node_id: values.nodeOrLocation === 'node' ? values.node : undefined,
                  location_id: values.nodeOrLocation === 'location' ? values.location : undefined,
                  limit_size: await UtilService.ParseBytes(values.limitSize),
                });

                notifications.show({ color: 'green', message: `保存成功` });
                props.onCreated();
                setSaveLoading(false);
              } catch (error: any) {
                setSaveLoading(false);
                notifications.show({ color: 'red', message: error.message });
              }
            })}
          >
            <Group justify="space-between">
              <NativeSelect
                w={380}
                withAsterisk
                label="存储"
                description="请选择需要关联的存储。"
                key={form.key('storage')}
                {...form.getInputProps('storage')}
                data={storageList.map((storage) => ({ label: `${storage.name}(${storage.id})`, value: storage.id! }))}
              />
              <Button mt={43} p={10} variant="default" onClick={() => setShowCreateStorage(true)}>
                新增
              </Button>
            </Group>

            <TextInput
              mt="md"
              withAsterisk
              label="存储大小限制"
              description="设定当前关联项在存储中的最大占用空间，默认值为 128MB。"
              placeholder="128MB"
              key={form.key('limitSize')}
              {...form.getInputProps('limitSize')}
            />

            <Divider mt={20} mb={10} />

            <Radio.Group
              label="关联节点或存储位置"
              description={
                <>
                  <Text size="xs" span>
                    请仅选择一个节点或存储位置，不能同时选择两者。
                  </Text>
                  <Text size="xs" span color="red">
                    相同节点或存储位置只能绑定一个存储。若已存在关联，新增关联将覆盖原有配置，且存储位置优先于节点。
                  </Text>
                </>
              }
              key={form.key('nodeOrLocation')}
              {...form.getInputProps('nodeOrLocation')}
            >
              <Stack pt="md" gap="xs">
                <Radio.Card radius="md" value="node" key="node" disabled={!isEmpty(props.storageLink)}>
                  <Group wrap="nowrap" align="flex-start" mt={10} mb={20} mx={10}>
                    <Radio.Indicator mt={5} />
                    <NativeSelect
                      w={400}
                      label="节点"
                      description="请选择需要关联的节点。"
                      disabled={!isEmpty(props.storageLink)}
                      key={form.key('node')}
                      {...form.getInputProps('node')}
                      data={nodeList.map((node) => ({ label: `${node.name}(${node.id})`, value: node.id! }))}
                    />
                  </Group>
                </Radio.Card>

                <Radio.Card radius="md" value="location" key="location" disabled={!isEmpty(props.storageLink)}>
                  <Group wrap="nowrap" align="flex-start" mt={10} mb={20} mx={10}>
                    <Radio.Indicator mt={5} />
                    <NativeSelect
                      w={400}
                      label="存储位置"
                      description="请选择需要关联的存储位置。"
                      disabled={!isEmpty(props.storageLink)}
                      key={form.key('location')}
                      {...form.getInputProps('location')}
                      data={locationList.map((location) => ({
                        label: `${location.name}(${location.node_id})`,
                        value: location.id!,
                      }))}
                    />
                  </Group>
                </Radio.Card>
              </Stack>
            </Radio.Group>

            <Group justify="flex-end" mt="md">
              <Button type="submit" loading={saveLoading} loaderProps={{ type: 'dots' }}>
                保存
              </Button>
            </Group>
          </form>
        )}
      </Box>
    </Modal>
  );
}
