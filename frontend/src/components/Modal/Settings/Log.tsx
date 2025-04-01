import { useEffect, useState } from 'react';
import { LogViewer } from '@patternfly/react-log-viewer';
import { ActionIcon, Button, Center, Group, Loader, Text, useMantineColorScheme } from '@mantine/core';
import { GrRefresh } from 'react-icons/gr';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { SystemService } from '../../../../bindings/github.com/pixelfs/pixelfs-desktop/services';

export function Log(props: { opened: boolean }) {
  const { colorScheme } = useMantineColorScheme();
  const [data, setData] = useState<Array<string>>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      setData(await SystemService.ReadLog(true));

      await new Promise((resolve) => setTimeout(resolve, 200));
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
      <Center mt={200}>
        <Loader color="blue" />
      </Center>
    );
  }

  return (
    <>
      <Group justify="end" mt={15}>
        <Button
          color="red"
          onClick={() =>
            modals.openConfirmModal({
              title: '提示',
              centered: true,
              children: <Text size="sm">确认要清空当前日志吗?</Text>,
              labels: { confirm: '删除', cancel: '取消' },
              confirmProps: { color: 'red' },
              onConfirm: async () => {
                try {
                  await SystemService.ClearLog();
                  notifications.show({ color: 'green', message: `日志清空成功` });
                  fetchData();
                } catch (error: any) {
                  notifications.show({ color: 'red', message: error.message });
                }
              },
            })
          }
        >
          清空日志
        </Button>

        <ActionIcon variant="transparent" size={20} onClick={() => fetchData()}>
          <GrRefresh size={15} color={colorScheme === 'light' ? '#000000' : '#ffffff'} />
        </ActionIcon>
      </Group>

      <LogViewer
        data={data}
        hasToolbar={false}
        hasLineNumbers={false}
        isTextWrapped={false}
        height={400}
        theme={colorScheme === 'light' ? 'light' : 'dark'}
      />
    </>
  );
}
