import {
  Box,
  Button,
  Center,
  Code,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Text,
  TextInput,
  Tree,
  TreeNodeData,
  useTree,
} from '@mantine/core';
import { isEmpty } from 'lodash-es';
import { FaFolder, FaFolderOpen } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { GetFileList, Mkdir } from '../../../wailsjs/go/services/FileService';
import { parsePathToContext } from '../../utils/common';
import { notifications } from '@mantine/notifications';
import { GetNodes } from '../../../wailsjs/go/services/NodeService';

function NewDirectory(props: { opened: boolean; onClose: () => void; onCreated: (fileName: string) => void }) {
  const [value, setValue] = useState('');

  return (
    <Modal opened={props.opened} zIndex={333} onClose={props.onClose} title="新建文件夹" size="auto" centered>
      <Box miw={300} mih={100}>
        <TextInput
          mt={10}
          placeholder="请输入文件夹名称"
          data-autofocus
          onChange={(event) => setValue(event.currentTarget.value)}
        />
        <Group justify="flex-end" mt={20}>
          <Button onClick={() => props.onCreated(value)}>确定</Button>
        </Group>
      </Box>
    </Modal>
  );
}

export function FileTree(props: {
  opened: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (path: string) => void;
}) {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<Array<TreeNodeData>>([]);
  const [selected, setSelected] = useState<string>('');
  const [loadedPaths, setLoadedPaths] = useState<Set<string>>(new Set());
  const [showNewDirectory, setShowNewDirectory] = useState<boolean>(false);

  const findNode = (nodes: TreeNodeData[], value: string): TreeNodeData | null => {
    for (const node of nodes) {
      if (node.value === value) return node;
      if (node.children) {
        const found = findNode(node.children, value);
        if (found) return found;
      }
    }

    return null;
  };

  const tree = useTree({
    onNodeCollapse: (value) => setSelected(value),
    onNodeExpand: async (value) => {
      setSelected(value);
      if (loadedPaths.has(value)) return;

      try {
        const files = await GetFileList(parsePathToContext(value));
        if (isEmpty(files)) return;

        const dirs = files.filter((file) => file.type! <= 3);
        const newChildren = dirs.map((dir) => ({ label: dir.name!, value: `${value}/${dir.name!}` }));

        setData((prevData) => {
          const updatedData = [...prevData];
          const targetNode = findNode(updatedData, value);
          if (targetNode) targetNode.children = newChildren;
          return updatedData;
        });

        setLoadedPaths((prev) => new Set(prev).add(value));
      } catch (error: any) {
        notifications.show({ color: 'red', message: error });
      }
    },
  });

  const fetchData = async () => {
    try {
      setSelected('');
      setLoading(true);
      setLoadedPaths(new Set());
      tree.collapseAllNodes();

      const nodes = await GetNodes();
      setData(nodes.map((node) => ({ label: `${node.name?.toLowerCase()}(${node.id})`, value: node.id! })));
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      notifications.show({ color: 'red', message: error });
    }
  };

  useEffect(() => {
    if (props.opened) fetchData();
  }, [props.opened]);

  return (
    <>
      <NewDirectory
        opened={showNewDirectory}
        onClose={() => setShowNewDirectory(false)}
        onCreated={async (fileName) => {
          try {
            if (isEmpty(fileName)) {
              notifications.show({ color: 'red', message: `文件夹名称不能为空` });
              return;
            }

            const newFolderPath = `${selected}/${fileName}`;
            await Mkdir(parsePathToContext(newFolderPath));
            notifications.show({
              color: 'green',
              message: (
                <Text size="sm">
                  文件夹 <Code>{fileName}</Code> 创建成功
                </Text>
              ),
            });

            setData((prevData) => {
              const updatedData = [...prevData];
              const targetNode = findNode(updatedData, selected);
              if (targetNode) {
                targetNode.children = targetNode.children || [];
                targetNode.children.push({ label: fileName, value: newFolderPath });
              }
              return updatedData;
            });

            setLoadedPaths((prev) => new Set([...prev, selected]));
            setShowNewDirectory(false);
          } catch (error: any) {
            notifications.show({ color: 'red', message: error.message });
          }
        }}
      />

      <Modal zIndex={222} opened={props.opened} onClose={props.onClose} title={props.title} size="auto" centered>
        <Box miw={500} h={300}>
          {loading ? (
            <Center pt={100}>
              <Loader color="blue" />
            </Center>
          ) : (
            <Box>
              <ScrollArea>
                <Tree
                  h={250}
                  selectOnClick
                  data={data}
                  tree={tree}
                  renderNode={(payload) => (
                    <Group gap={5} my={3} {...payload.elementProps}>
                      {payload.expanded ? <FaFolderOpen size={14} /> : <FaFolder size={14} />}
                      <span>{payload.node.label}</span>
                    </Group>
                  )}
                />
              </ScrollArea>

              <Group justify="space-between" my={10}>
                <Button
                  variant="default"
                  onClick={() => {
                    const parentCtx = parsePathToContext(selected);
                    if (isEmpty(selected) || isEmpty(parentCtx.node_id) || isEmpty(parentCtx.location)) {
                      notifications.show({ color: 'red', message: `不能在根节点或者存储位置创建文件夹` });
                      return;
                    }

                    setShowNewDirectory(true);
                  }}
                >
                  新建文件夹
                </Button>

                <Button onClick={() => props.onConfirm(selected)}>确认</Button>
              </Group>
            </Box>
          )}
        </Box>
      </Modal>
    </>
  );
}
