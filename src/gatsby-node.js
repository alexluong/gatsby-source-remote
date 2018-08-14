import crypto from "crypto"
import { createRemoteFileNode } from "gatsby-source-filesystem"

function sourceNodes({ actions, createNodeId }, options) {
  delete options.plugins

  if (!Array.isArray(options.files)) {
    return
  }

  const { createNode } = actions

  options.files.forEach(file => {
    if (!file.name || !file.url) {
      throw new Error('All file must contain a "name" and an "url" property')
    }

    const nodeId = createNodeId(`remotefile-${file.name}`)
    const nodeContent = JSON.stringify(file)
    const nodeContentDigest = crypto
      .createHash("md5")
      .update(nodeContent)
      .digest("hex")

    const nodeData = {
      ...file,
      id: nodeId,
      parent: null,
      children: [],
      internal: {
        type: "RemoteFile",
        content: nodeContent,
        contentDigest: nodeContentDigest,
      },
    }

    createNode(nodeData)
  })
}

async function onCreateNode({ node, actions, store, cache }) {
  if (node.internal.type !== "RemoteFile") {
    return
  }

  const { createNode } = actions

  const fileNode = await createRemoteFileNode({
    url: node.url,
    store,
    cache,
    createNode,
    createNodeId: id => `downloaded-remotefile-${id}`,
  })

  if (fileNode) {
    node.file___NODE = fileNode.id
  }
}

export { sourceNodes, onCreateNode }
