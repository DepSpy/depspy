import { useStaticStore } from "@/contexts";
import { extractFileName } from "../../utils";
import { shallow } from "zustand/shallow";
import { useMemo } from "react";
import useLanguage from "@/i18n/hooks/useLanguage";
import DiffPannel from "@/components/DiffPanel";
import { Card, Collapse, Flex, Tag, Typography, Empty } from "antd";
import "./index.scss";

const { Title, Text } = Typography;
const { Panel } = Collapse;

export const Selected = () => {
  const { staticGraph, highlightedNodeId } = useStaticStore(
    (state) => ({
      staticGraph: state.staticGraph,
      highlightedNodeId: state.highlightedNodeId,
    }),
    shallow,
  );
  const selectNodeInfo = useMemo(() => {
    const entryId = highlightedNodeId.split("-")[0];
    return staticGraph.get(entryId)
  }, [highlightedNodeId, staticGraph]);

  const { t } = useLanguage();

  if(!selectNodeInfo){
    return null;
  }
  return (
    <div className="bg-bg-layout min-w-90">
      <Card variant="borderless" className="w-full mb-4 bg-bgLayout" title={
        <Flex justify="space-between" align="center">
          <Title level={4} className="color-primaryBase">{selectNodeInfo.relativeId}</Title>
          <Flex gap="small">
            {selectNodeInfo.isGitChange && <Tag color="yellow">{t("static.gitChanged")}</Tag>}
            {selectNodeInfo.isImportChange && <Tag color="blue">{t("static.importChanged")}</Tag>}
            {selectNodeInfo.isSideEffectChange && <Tag color="red">{t("static.sideEffectChanged")}</Tag>}
          </Flex>
        </Flex>
      }>
        <Flex wrap gap="small">
          {/* Git Diff */}
          <Collapse ghost>
            <Panel header={<Text strong>{t("static.gitChanged")}</Text>} key="1">
              {selectNodeInfo.curCode ? (
                <div className="scroll-bar rounded-lg p-2" style={{ height: '400px', overflow: 'auto' }}>
                  <DiffPannel preCode={selectNodeInfo.preCode} curCode={selectNodeInfo.curCode} />
                </div>
              ) : (
                <Empty description={t("static.sidebar.global.noGit")} />
              )}
            </Panel>
          </Collapse>
          {/* Removed Exports */}
          <Collapse ghost>
            <Panel header={<Text strong>{t("static.sidebar.select.export.remove")}</Text>} key="4">
              {selectNodeInfo.removedExports.length ? (
                <Flex wrap gap="small">
                  {selectNodeInfo.removedExports.map((exportItem, index) => (
                    <Tag key={index} bordered={false} color="purple-inverse" style={{ padding: '4px 8px' }}>
                      {exportItem}
                    </Tag>
                  ))}
                </Flex>
              ) : (
                <Empty description={t("static.sidebar.select.export.noRemove")} />
              )}
            </Panel>
          </Collapse>
          {/* Rendered Exports */}
          <Collapse ghost>
            <Panel header={<Text strong>{t("static.sidebar.select.export.render")}</Text>} key="5">
              {selectNodeInfo.renderedExports.length ? (
                <Flex wrap gap="small">
                  {selectNodeInfo.renderedExports.map((exportItem, index) => (
                    <Tag key={index} bordered={false} color="purple-inverse" style={{ padding: '4px 8px' }}>
                      {exportItem}
                    </Tag>
                  ))}
                </Flex>
              ) : (
                <Empty description={t("static.sidebar.select.export.noRender")} />
              )}
            </Panel>
          </Collapse>
          {/* Changed Imports */}
          <Collapse ghost>
            <Panel header={<Text strong>{t("static.sidebar.select.import.changed")}</Text>} key="2">
              {Object.keys(selectNodeInfo.importEffectedNames).length ? (
                <Flex vertical gap="small">
                  {Object.keys(selectNodeInfo.importEffectedNames).map((Item) => (
                    <Card key={Item} size="small" title={extractFileName(Item)}>
                      <Flex wrap gap="small">
                        {selectNodeInfo.importEffectedNames[Item].map((value, index) => (
                          <Tag key={index} bordered={false} color="purple-inverse" style={{ padding: '4px 8px' }}>
                            {value}
                          </Tag>
                        ))}
                      </Flex>
                    </Card>
                  ))}
                </Flex>
              ) : (
                <Empty description={t("static.sidebar.select.import.noChanged")} />
              )}
            </Panel>
          </Collapse>
          {/* Changed Exports */}
          <Collapse ghost>
            <Panel header={<Text strong>{t("static.sidebar.select.export.changed")}</Text>} key="3">
              {Object.keys(selectNodeInfo.exportEffectedNamesToReasons).length ? (
                <Flex vertical gap="small">
                  {Object.keys(selectNodeInfo.exportEffectedNamesToReasons).map((Item) => (
                    <Card key={Item} size="small" title={
                      <Text strong>{Item || t("static.sidebar.select.export.sideEffect")}</Text>
                    }>
                      {selectNodeInfo.exportEffectedNamesToReasons[Item].isNativeCodeChange && (
                        <Tag color="purple-inverse" style={{ margin: '4px' }}>Native Code Changed</Tag>
                      )}

                      {Object.keys(selectNodeInfo.exportEffectedNamesToReasons[Item].importEffectedNames).map((key) => (
                        <Card key={key} size="small" style={{ marginTop: '8px' }} title={key}>
                          <Flex wrap gap="small">
                            {selectNodeInfo.exportEffectedNamesToReasons[Item].importEffectedNames[key].map((value, index) => (
                              <Tag key={index} bordered={false} color="purple-inverse" style={{ padding: '4px 8px' }}>
                                {value || t("static.sidebar.select.export.sideEffect")}
                              </Tag>
                            ))}
                          </Flex>
                        </Card>
                      ))}
                    </Card>
                  ))}
                </Flex>
              ) : (
                <Empty description={t("static.sidebar.select.export.noChanged")} />
              )}
            </Panel>
          </Collapse>
        </Flex>

      </Card>
    </div>
  );
};