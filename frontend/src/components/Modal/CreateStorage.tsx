import { Box, Button, Code, Grid, Group, Modal, Select, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { isEmpty } from 'lodash-es';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { AddS3Storage } from '../../../wailsjs/go/services/StorageService';
import { v1 } from '../../../wailsjs/go/models';

export function CreateStorage(props: { opened: boolean; onClose: () => void; onCreated: () => void }) {
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      type: 'S3',
      network: 'public',
      endpoint: '',
      region: '',
      bucket: '',
      accessKey: '',
      secretKey: '',
      prefix: '',
      pathStyle: 'off',
    },

    validate: {
      name: (value) => (!isEmpty(value) ? null : '名称不能为空'),
      endpoint: (value) => (!isEmpty(value) ? null : '服务端点不能为空'),
      region: (value) => (!isEmpty(value) ? null : '区域不能为空'),
      bucket: (value) => (!isEmpty(value) ? null : '存储桶不能为空'),
      accessKey: (value) => (!isEmpty(value) ? null : 'accessKey 不能为空'),
      secretKey: (value) => (!isEmpty(value) ? null : 'secretKey 不能为空'),
    },
  });

  useEffect(() => {
    if (props.opened) form.reset();
  }, [props.opened]);

  return (
    <Modal opened={props.opened} onClose={props.onClose} title="创建存储" size="auto" centered>
      <Box w={750} mih={100}>
        <form
          onSubmit={form.onSubmit(async (values) => {
            try {
              setSaveLoading(true);

              const config = new v1.StorageS3Config({
                endpoint: values.endpoint,
                access_key: values.accessKey,
                secret_key: values.secretKey,
                region: values.region,
                bucket: values.bucket,
                prefix: values.prefix,
                path_style: values.pathStyle === 'on',
              });

              await AddS3Storage(values.name, config, values.network === 'public' ? 0 : 1);
              notifications.show({
                color: 'green',
                message: (
                  <Text size="sm">
                    存储 <Code>{values.name}</Code> 创建成功
                  </Text>
                ),
              });

              props.onCreated();
              setSaveLoading(false);
            } catch (error: any) {
              setSaveLoading(false);
              notifications.show({
                color: 'red',
                message: <Text size="sm">请检查填写的服务端信息是否正确，{error}</Text>,
              });
            }
          })}
        >
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                withAsterisk
                label="名称"
                description="存储的名称，用于标识。"
                key={form.key('name')}
                {...form.getInputProps('name')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Select
                withAsterisk
                label="网络类型"
                description="存储的网络类型，是否可以被外网访问。"
                data={[
                  { label: '公网', value: 'public' },
                  { label: '私网', value: 'private' },
                ]}
                allowDeselect={false}
                key={form.key('network')}
                {...form.getInputProps('network')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Select
                withAsterisk
                label="类型"
                description="存储的类型，目前仅支持 S3。"
                data={[{ label: 'S3', value: 'S3' }]}
                allowDeselect={false}
                key={form.key('type')}
                {...form.getInputProps('type')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                withAsterisk
                label="服务端点"
                description="S3 服务的端点地址，eg: https://xxxxxx.r2.cloudflarestorage.com。"
                key={form.key('endpoint')}
                {...form.getInputProps('endpoint')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                withAsterisk
                label="区域"
                description="存储的区域，eg: us-west-1。"
                key={form.key('region')}
                {...form.getInputProps('region')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                withAsterisk
                label="存储桶"
                description="存储的 Bucket 名称。"
                key={form.key('bucket')}
                {...form.getInputProps('bucket')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                withAsterisk
                label="Access Key"
                description="S3 服务的 Access Key。"
                key={form.key('accessKey')}
                {...form.getInputProps('accessKey')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                withAsterisk
                label="Secret Key"
                description="S3 服务的 Secret Key。"
                key={form.key('secretKey')}
                {...form.getInputProps('secretKey')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                label="前缀"
                description="存储的前缀，用于存储路径。"
                key={form.key('prefix')}
                {...form.getInputProps('prefix')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Select
                label="Path Style"
                description="是否使用 Path Style 访问。"
                data={[
                  { label: '关闭', value: 'off' },
                  { label: '开启', value: 'on' },
                ]}
                allowDeselect={false}
                key={form.key('pathStyle')}
                {...form.getInputProps('pathStyle')}
              />
            </Grid.Col>
          </Grid>

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
