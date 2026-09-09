import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import kotlin from 'highlight.js/lib/languages/kotlin'
import dart from 'highlight.js/lib/languages/dart'
import java from 'highlight.js/lib/languages/java'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import bash from 'highlight.js/lib/languages/bash'
import sql from 'highlight.js/lib/languages/sql'
import json from 'highlight.js/lib/languages/json'
import gradle from 'highlight.js/lib/languages/gradle'

const languages = { kotlin, dart, java, xml, yaml, bash, sql, json, gradle }

/** Render markdown của đáp án. Nội dung là dữ liệu tĩnh trong repo nên an toàn. */
export const Markdown = memo(function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-answer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { languages, detect: true, ignoreMissing: true }]]}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
})
