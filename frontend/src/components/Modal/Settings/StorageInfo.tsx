import { Box, Modal, Table, Text } from '@mantine/core';

import { useEffect, useState } from 'react';
import * as v1 from '../../../../bindings/github.com/pixelfs/pixelfs/gen/pixelfs/v1';

export function StorageInfo(props: { opened: boolean; storage?: v1.Storage; onClose: () => void }) {
  const [config, setConfig] = useState<v1.StorageS3Config>();

  useEffect(() => {
    if (props.opened && props.storage) {
      setConfig(props.storage.Config?.['S3']);
    }
  }, [props.opened, props.storage]);

  return (
    <Modal opened={props.opened} onClose={props.onClose} title="存储信息" size="auto" centered>
      <Box miw={600} mb={10}>
        <Table variant="vertical" layout="auto" withRowBorders={false}>
          <Table.Tbody>
            {[
              { label: '名称', value: props.storage?.name },
              { label: '网络', value: props.storage?.network === 1 ? '私网' : '公网' },
              { label: '服务端点', value: config?.endpoint },
              { label: '区域', value: config?.region },
              { label: '存储桶', value: config?.bucket },
              { label: 'Access Key', value: config?.access_key },
              { label: 'Secret Key', value: config?.secret_key },
              { label: '前缀', value: config?.prefix },
              { label: 'Path Style', value: config?.path_style ? '开启' : '关闭' },
            ].map(({ label, value }) => (
              <Table.Tr key={label}>
                <Table.Th w={150}>
                  <Text>{label}</Text>
                </Table.Th>
                <Table.Td>{value || '-'}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>
    </Modal>
  );
}
