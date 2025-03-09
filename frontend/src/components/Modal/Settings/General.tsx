import {
  Box,
  Button,
  Flex,
  Group,
  NumberInput,
  SegmentedControl,
  Table,
  Text,
  TextInput,
  useMantineColorScheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { isEmpty } from 'lodash-es';
import { useEffect } from 'react';
import {
  GetDownloadPath,
  GetDownloadThreads,
  SetDownloadPath,
  SetDownloadThreads,
} from '../../../../wailsjs/go/services/PreferencesService';
import { SelectDirectoryDialog } from '../../../../wailsjs/go/services/SystemService';
import { notifications } from '@mantine/notifications';

export function General(props: { opened: boolean }) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      downloadPath: '',
      downloadThreads: 0,
    },

    validate: {
      downloadPath: (value) => (!isEmpty(value) ? null : '下载路径不能为空'),
      downloadThreads: (value) => (value > 0 ? null : '下载线程数必须大于 0'),
    },
  });

  useEffect(() => {
    if (props.opened) {
      const init = async () => {
        form.setValues({
          downloadPath: await GetDownloadPath(),
          downloadThreads: await GetDownloadThreads(),
        });
      };

      init();
    }
  }, [props.opened]);

  return (
    <Box pl={130}>
      <form
        onSubmit={form.onSubmit(async (values) => {
          try {
            await SetDownloadPath(values.downloadPath);
            await SetDownloadThreads(values.downloadThreads);

            notifications.show({ color: 'green', message: '保存成功' });
          } catch (error: any) {
            notifications.show({ color: 'red', message: error });
          }
        })}
      >
        <Flex direction="column" justify="space-between" h={460}>
          <Table mt={30} variant="vertical" layout="auto" withRowBorders={false}>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td w={150}>
                  <Text>主题</Text>
                </Table.Td>
                <Table.Td>
                  <SegmentedControl
                    withItemsBorders={false}
                    value={colorScheme}
                    onChange={(value) => setColorScheme(value as any)}
                    data={[
                      { label: '自动', value: 'auto' },
                      { label: '深色', value: 'dark' },
                      { label: '浅色', value: 'light' },
                    ]}
                  />
                </Table.Td>
              </Table.Tr>

              <Table.Tr>
                <Table.Td>
                  <Text>下载路径</Text>
                </Table.Td>
                <Table.Td>
                  <TextInput
                    w={350}
                    pointer
                    key={form.key('downloadPath')}
                    {...form.getInputProps('downloadPath')}
                    onClick={async () => {
                      const downloadPath = await SelectDirectoryDialog('选择下载路径');
                      if (!isEmpty(downloadPath)) form.setValues({ downloadPath });
                    }}
                  />
                </Table.Td>
              </Table.Tr>

              <Table.Tr>
                <Table.Td>
                  <Text>下载线程数</Text>
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    min={1}
                    max={10}
                    w={150}
                    key={form.key('downloadThreads')}
                    {...form.getInputProps('downloadThreads')}
                  />
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>

          <Group justify="flex-end" mt="md" mr="md">
            <Button type="submit" loaderProps={{ type: 'dots' }}>
              保存
            </Button>
          </Group>
        </Flex>
      </form>
    </Box>
  );
}
