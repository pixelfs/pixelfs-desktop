import { useState } from 'react';
import { Box, Modal, Tabs } from '@mantine/core';
import { General } from './General';
import { Node } from './Node';
import { Storage } from './Storage';
import { StorageLink } from './StorageLink';

export function Settings(props: { opened: boolean; onClose: () => void }) {
  const [value, setValue] = useState<string>('general');

  return (
    <Modal opened={props.opened} onClose={props.onClose} title="设置" size="auto" centered>
      <Box w={800} h={500}>
        <Tabs defaultValue={value} onChange={(value) => setValue(value ?? 'general')}>
          <Tabs.List>
            <Tabs.Tab value="general">通用</Tabs.Tab>
            <Tabs.Tab value="node">节点管理</Tabs.Tab>
            <Tabs.Tab value="storage">存储管理</Tabs.Tab>
            <Tabs.Tab value="storageLink">存储关联</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="general">
            <General opened={value === 'general'} />
          </Tabs.Panel>

          <Tabs.Panel value="node">
            <Node opened={value === 'node'} />
          </Tabs.Panel>

          <Tabs.Panel value="storage">
            <Storage opened={value === 'storage'} />
          </Tabs.Panel>

          <Tabs.Panel value="storageLink">
            <StorageLink opened={value === 'storageLink'} />
          </Tabs.Panel>
        </Tabs>
      </Box>
    </Modal>
  );
}
