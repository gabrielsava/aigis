var ejs = require('ejs');
var _ = require('lodash');
var path = require('path');

function renderTree(type, tree, depth, root, outputPath, disableLinkIndex, isJSON) {
  if (!tree) {
    return '';
  }
  
  var ul = ejs.compile(
    '<ul data-path-depth="<%- depth %>">' +
    '<% children.forEach(function(child) { %><%- child %><% }) %>' +
    '</ul>'
  );
  
  var renderTreeObject = {
    children: renderTreeChildren.apply(this, arguments),
    depth: depth
  };
  
  return isJSON ? renderTreeObject : ul(renderTreeObject);
}

function renderTreeChildren(type, tree, depth, root, outputPath, disableLinkIndex, isJSON) {
  if (!tree) {
    return '';
  }
  
  var li = ejs.compile(
    '<li data-path-depth="<%- depth %>">' +
    '<a<% if (href) { %> href="<%- href %>"<% } %><% if (isCurrent) { %> data-tree-current<% } %>><%- name %></a>' +
    '<%- children %>' +
    '</li>'
  );
  
  var _index = disableLinkIndex ? '' : 'index.html';
  
  return _.map(tree, function (values, name) {
    var href;
    var relPath;
    var isCurrent = false;
    var _out = outputPath;
    
    if (values.path) {
      relPath = path.join(type, values.path.replace(/\s+/g, '-'), _index);
      href = path.join(root, relPath);
    }
    if (relPath) {
      if (disableLinkIndex) {
        _out = outputPath.split(path.sep);
        _out.pop();
        _out = _out.join(path.sep)
      }
      isCurrent = checkCurrentPath(relPath, _out);
    }
    
    var item = {
      name: values.name,
      href: href || '',
      depth: values.depth || '0',
      outputPath: outputPath,
      relPath: relPath,
      isCurrent: isCurrent,
      isCurrentChildren: isCurrent && Number(depth) > 0
    };
    
    if (isJSON) {
      item.children = renderTreeChildren(type, values.children, depth + 1, root, outputPath, disableLinkIndex, isJSON)
    } else {
      item.children = renderTree(type, values.children, depth + 1, root, outputPath, disableLinkIndex, isJSON);
    }
    
    return isJSON ? item : li(item);
  });
}

function checkCurrentPath(relPath, outPath) {
  if(relPath === outPath) {
    return true;
  }
  
  var relPathItems = relPath.split(path.sep);
  var outPathItems = outPath.split(path.sep);
  
  if(outPathItems.length > relPathItems.length) {
    return _.difference(relPathItems, outPathItems).length < outPathItems.length - relPathItems.length;
  }
  
  return false;
}


module.exports = renderTree;
