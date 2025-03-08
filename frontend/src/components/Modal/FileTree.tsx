import {
  Box,
  Button,
  Center,
  Group,
  Loader,
  LoadingOverlay,
  Modal,
  ScrollArea,
  Tree,
  TreeNodeData,
  useTree,
} from '@mantine/core';
import { FaFolder, FaFolderOpen } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { CopyFile, GetFileList, MoveFile } from '../../../wailsjs/go/services/FileService';
import { parsePathToContext } from '../../utils/common';
import { notifications } from '@mantine/notifications';
import { isEmpty } from 'lodash-es';

export function FileTree(props: { opened: boolean; path: string; isMove: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<Array<TreeNodeData>>([]);
  const [selected, setSelected] = useState<string>('');
  const [loadedPaths, setLoadedPaths] = useState<Set<string>>(new Set());

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

        const dirs = (files.files ?? []).filter((file) => file.type! <= 3);
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
      setLoading(true);
      setLoadedPaths(new Set());

      tree.collapseAllNodes();
      const dirs = ((await GetFileList({})).files ?? []).filter((file) => file.type! <= 3);

      setData(dirs.map((dir) => ({ label: dir.name!, value: dir.name! })));
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
    <Modal
      opened={props.opened}
      onClose={props.onClose}
      title={props.isMove ? '移动文件' : '复制文件'}
      size="auto"
      centered
    >
      <Box miw={400} h={300}>
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

            <Group justify="flex-end" my={10}>
              <Button
                variant="default"
                onClick={async () => {
                  const srcCtx = parsePathToContext(props.path);
                  const destCtx = parsePathToContext(selected);

                  if (isEmpty(destCtx.node_id) || isEmpty(destCtx.location)) {
                    notifications.show({
                      color: 'red',
                      message: `不能${props.isMove ? '移动' : '复制'}到节点和位置目录`,
                    });
                    return;
                  }

                  destCtx.path = `${destCtx.path}/${props.path.split('/').pop()}`;
                  setSelected('');
                  props.onClose();

                  props.isMove ? await MoveFile(srcCtx, destCtx) : await CopyFile(srcCtx, destCtx);
                }}
              >
                {props.isMove ? '移动' : '复制'}
              </Button>
            </Group>
          </Box>
        )}
      </Box>
    </Modal>
  );
}
