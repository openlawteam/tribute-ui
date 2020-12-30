import React from 'react';
import ReactModal from 'react-modal';

type ModalProps = {
  children: React.ReactNode;
  isOpen: boolean;
  isOpenHandler: (isOpen: boolean) => void;
  keyProp: string;
  styleProps?: Record<string, string>;
};

export default function Modal({
  children,
  keyProp,
  isOpen,
  styleProps,
  isOpenHandler,
}: ModalProps) {
  return (
    <ReactModal
      key={keyProp}
      ariaHideApp={false}
      className="modal-content"
      isOpen={isOpen}
      onRequestClose={() => {
        isOpenHandler(isOpen);
      }}
      overlayClassName="modal-overlay"
      role="dialog"
      style={
        {
          overlay: {zIndex: '99'},
          content: {maxWidth: '34.5rem'},
          ...styleProps,
        } as any
      }>
      {children}
    </ReactModal>
  );
}
