import ReactDiffViewer from 'react-diff-viewer';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import atomOneDark from 'react-syntax-highlighter/dist/esm/styles/hljs/atom-one-dark';
import ts from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript';
import { useStaticStore } from '@/contexts';
import { shallow } from 'zustand/shallow';
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
SyntaxHighlighter.registerLanguage('ts', ts);

interface Props {
    preCode: string,
    curCode: string,
    splitView?: boolean
    hideLineNumbers?: boolean
}
function DiffPannel({ preCode, curCode, splitView = false, hideLineNumbers = true }: Props) {
    const { fullscreen, setFullscreen } = useStaticStore(
        (state) => ({
            fullscreen: state.fullscreen,
            setFullscreen: state.setFullscreen,
        }),
        shallow,
    );
    return (
        <div className='relative'>
            <div className="absolute right-2 top-2 text-text z-100">
                {curCode ? (
                    fullscreen ? <FullscreenExitOutlined
                        className="font-size-[20px]"
                        onClick={() => setFullscreen(false)} /> :
                        <FullscreenOutlined
                            className=" font-size-[20px]"
                            onClick={() => setFullscreen(true)} />
                ) : (
                    <></>
                )}
            </div>
            <ReactDiffViewer
                oldValue={preCode}
                newValue={curCode}
                splitView={splitView}
                hideLineNumbers={hideLineNumbers}
                disableWordDiff
                useDarkTheme={true}
                // compareMethod={DiffMethod.WORDS_WITH_SPACE}
                renderContent={str => {
                    return (
                        <SyntaxHighlighter
                            customStyle={{
                                backgroundColor: "transparent"
                            }}
                            wrapLines
                            wrapLongLines
                            style={atomOneDark}
                            language="ts"
                        >
                            {str}
                        </SyntaxHighlighter>
                    );
                }}
            />
        </div>
    );
}
export default DiffPannel;