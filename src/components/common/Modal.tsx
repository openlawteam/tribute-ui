import ReactModal from 'react-modal';

import FadeIn from './FadeIn';

type ModalProps = {
  children: React.ReactNode;
  isOpen: boolean;
  isOpenHandler: (isOpen: boolean) => void;
  keyProp: string;
  modalClassNames?: string;
  styleProps?: Record<string, string>;
};

export default function Modal({
  children,
  isOpen,
  isOpenHandler,
  keyProp,
  modalClassNames,
  styleProps,
}: ModalProps) {
  return (
    <ReactModal
      key={keyProp}
      ariaHideApp={false}
      className={`modal-container ${modalClassNames}`}
      isOpen={isOpen}
      onRequestClose={() => {
        isOpenHandler(isOpen);
      }}
      overlayClassName="modal-overlay"
      role="dialog"
      style={
        {
          overlay: {zIndex: '99'},
          ...styleProps,
        } as any
      }>
      <FadeIn>
        <div className="modal">{children}</div>
      </FadeIn>
    </ReactModal>
  );
}
