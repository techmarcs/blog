import React from 'react';

import { toId } from '../helpers/strings';
import { getSnippet } from '../helpers/htmlAst';

import {
  Article,
  Text,
  Bold,
  Paragraph,
  Code,
  TextLink,
  Italic,
  List,
  ListItem,
  Break,
  Image,
  Title,
  Heading,
  Small,
  Subheading,
  H3,
  H4,
  H5,
  H6,
  InlineCode,
  Quote,
  Block,
  Iframe,
  OrderedList,
} from '../basics/Text';

// remark includes an "AST" of HTML, and I want to be able to use styled-
// components with it. Thus, HTML tree renderer. Maps tagNames to a
// styled-component, plus some quirks due to HTML validation.
export const renderHtml = (ast, metadata) => (
  <Article>
    <Title>{metadata.title}</Title>
    <Small>{metadata.date}</Small>{' '}
    {metadata.updated && (
      <Small>
        <Italic>
          <TextLink
            href={`https://github.com/vcarl/blog/blame/master/src/${
              metadata.path
            }`}
          >
            last updated {metadata.updated}
          </TextLink>
        </Italic>
      </Small>
    )}
    {metadata.series && (
      <Small>Part of a series: {metadata.series}</Small>
    )}
    {renderTree(ast.children)}
  </Article>
);

// This is an abomination, but this is statically rendered (thus will never
// reorder) and it takes care of the key warning. Don't @ me.
let key = 0;

const getLinkableProps = (id, props) => ({
  ...props,
  hasLink: true,
  id: props.id ? `${props.id} ${id}` : id,
});
const getId = node => toId(getSnippet(node));

const renderTree = nodes =>
  nodes.map(({ type, tagName, properties, children, value }) => {
    if (type === 'text') {
      return value;
    }
    if (type === 'element') {
      const {
        tagName: Component,
        props,
        noChildren,
      } = mapTagToComponent(tagName, properties, children);
      // img and hrs can't be rendered with children or React bitches.
      return noChildren ? (
        <Component key={key++} {...props} />
      ) : (
        <Component key={key++} {...props}>
          {renderTree(children)}
        </Component>
      );
    }
    return 'UNKNOWN NODE';
  });

export const mapTagToComponent = (tagName, props, children) => {
  switch (tagName) {
    case 'root':
      return { tagName: 'article', props };
    case 'a': {
      return {
        tagName: TextLink,
        props,
      };
    }
    case 'p': {
      return {
        tagName: Paragraph,
        props: getLinkableProps(getId(children), props),
      };
    }
    case 'strong':
      return {
        tagName: Bold,
        props,
      };
    case 'blockquote':
      return {
        tagName: Quote,
        props,
      };
    case 'em':
      return {
        tagName: Italic,
        props,
      };
    case 'h1': {
      return {
        tagName: Heading,
        props: getLinkableProps(getId(children), props),
      };
    }
    case 'h2': {
      return {
        tagName: Subheading,
        props: getLinkableProps(getId(children), props),
      };
    }
    case 'h3': {
      return {
        tagName: H3,
        props: getLinkableProps(getId(children), props),
      };
    }
    case 'h4': {
      return {
        tagName: H4,
        props: getLinkableProps(getId(children), props),
      };
    }
    case 'h5': {
      return {
        tagName: H5,
        props: getLinkableProps(getId(children), props),
      };
    }
    case 'h6': {
      return {
        tagName: H6,
        props: getLinkableProps(getId(children), props),
      };
    }
    case 'img':
      return {
        tagName: Image,
        props,
        noChildren: true,
      };
    case 'hr':
      return {
        tagName: Break,
        props,
        noChildren: true,
      };
    case 'span':
      return {
        tagName: Text,
        props,
      };
    case 'div':
      return {
        tagName: Block,
        props,
      };
    case 'ol':
      return {
        tagName: OrderedList,
        props,
      };
    case 'ul':
      return {
        tagName: List,
        props,
      };
    case 'li':
      return {
        tagName: ListItem,
        props,
      };
    case 'pre':
      // Remark parses multiline code blocks weirdly, there's a nested `code`
      // in there, which breaks this parser's 1:1 tagName:Component assumption.
      // This is hacky but it works.
      return {
        tagName: Code,
        props: {
          ...props,
          children: renderTree(children[0].children),
        },
        noChildren: true,
      };
    case 'code':
      // Syntax highlighting globs onto all pre tags with a certain class, so
      // strip the class from inline blocks.
      const { className, ...rest } = props;
      return {
        tagName: InlineCode,
        props: rest,
      };
    case 'iframe':
      return {
        tagName: Iframe,
        props,
      };
    default:
      console.log('Tried to render unhandled tag', tagName);
      return { tagName: Text, props };
  }
};
