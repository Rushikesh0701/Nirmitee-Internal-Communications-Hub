import { TextStyle } from '@tiptap/extension-text-style';

const FontStyle = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: element => {
          const fontSize = element.style.fontSize;
          if (!fontSize) return null;
          return fontSize.replace('px', '');
        },
        renderHTML: attributes => {
          if (!attributes.fontSize) {
            return {};
          }
          return {
            style: `font-size: ${attributes.fontSize}px`,
          };
        },
      },
      fontFamily: {
        default: null,
        parseHTML: element => {
          const fontFamily = element.style.fontFamily;
          if (!fontFamily) return null;
          return fontFamily.replace(/['"]+/g, '');
        },
        renderHTML: attributes => {
          if (!attributes.fontFamily) {
            return {};
          }
          return {
            style: `font-family: ${attributes.fontFamily}`,
          };
        },
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setFontSize: (fontSize) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run();
      },
      setFontFamily: (fontFamily) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontFamily })
          .run();
      },
      unsetFontFamily: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontFamily: null })
          .removeEmptyTextStyle()
          .run();
      },
    };
  },
});

export default FontStyle;

