import { Node } from '@tiptap/core';

// Custom Video Extension - supports both video tags and iframe embeds (YouTube)
const VideoExtension = Node.create({
  name: 'video',
  group: 'block',
  draggable: true,
  
  addOptions() {
    return {
      inline: false,
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: '100%',
      },
      height: {
        default: '400px',
      },
      controls: {
        default: true,
      },
      autoplay: {
        default: false,
      },
      loop: {
        default: false,
      },
      isIframe: {
        default: false,
      },
      allowfullscreen: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe[src]',
        getAttrs: (node) => {
          const src = node.getAttribute('src');
          return {
            src,
            width: node.getAttribute('width') || '100%',
            height: node.getAttribute('height') || '400px',
            isIframe: true,
            allowfullscreen: node.hasAttribute('allowfullscreen'),
          };
        },
      },
      {
        tag: 'video[src]',
        getAttrs: (node) => ({
          src: node.getAttribute('src'),
          width: node.getAttribute('width') || '100%',
          height: node.getAttribute('height') || '400px',
          controls: node.hasAttribute('controls'),
          autoplay: node.hasAttribute('autoplay'),
          loop: node.hasAttribute('loop'),
          isIframe: false,
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { isIframe, src, width, height, controls, autoplay, loop, allowfullscreen } = HTMLAttributes;
    
    if (isIframe && src) {
      return [
        'iframe',
        {
          ...this.options.HTMLAttributes,
          src,
          width,
          height,
          frameBorder: '0',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowFullScreen: allowfullscreen !== false,
          style: `max-width: 100%; border-radius: 0.5rem;`,
        },
      ];
    }
    
    return [
      'video',
      {
        ...this.options.HTMLAttributes,
        src,
        width,
        height,
        controls: controls !== false,
        autoplay: autoplay === true,
        loop: loop === true,
        style: `max-width: 100%;`,
      },
    ];
  },

  addCommands() {
    return {
      setVideo: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});

export default VideoExtension;

