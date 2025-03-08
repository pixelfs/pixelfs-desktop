import { Box, Modal, ScrollArea, Tabs } from '@mantine/core';
import { Upload } from './Upload';
import { Download } from './Download';
import { Copy } from './Copy';
import { useState } from 'react';

export function TransportModal(props: { opened: boolean; onClose: () => void }) {
  const [value, setValue] = useState<string>('download');

  return (
    <Modal opened={props.opened} onClose={props.onClose} title="传输管理" size="auto" centered>
      <Box w={850}>
        <Tabs defaultValue={value} onChange={(value) => setValue(value ?? 'download')}>
          <Tabs.List>
            <Tabs.Tab value="download">下载</Tabs.Tab>
            <Tabs.Tab value="upload">上传</Tabs.Tab>
            <Tabs.Tab value="copy">复制移动</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="download">
            <ScrollArea h={500}>
              <Download opened={value === 'download'} />
            </ScrollArea>
          </Tabs.Panel>

          <Tabs.Panel value="upload">
            <ScrollArea h={500}>
              <Upload opened={value === 'upload'} />
            </ScrollArea>
          </Tabs.Panel>

          <Tabs.Panel value="copy">
            <ScrollArea h={500}>
              <Copy opened={value === 'copy'} />
            </ScrollArea>
          </Tabs.Panel>
        </Tabs>
      </Box>
    </Modal>
  );
}
