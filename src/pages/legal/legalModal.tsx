import React from 'react'
import { Modal, Typography } from 'antd'
import SimpleBar from 'simplebar-react'
import cn from 'classnames'
import { modalMaskStyle, modalMaskTransitionName } from '@/common/modalMotion'
import { legalDocuments, LegalDocumentType } from './legalDocuments'
import styles from './legalModal.module.less'

const { Paragraph, Title } = Typography

interface LegalModalProps {
  open: boolean
  type: LegalDocumentType
  onClose: () => void
}

const LegalModal: React.FC<LegalModalProps> = ({ open, type, onClose }) => {
  const document = legalDocuments[type]

  return (
    <Modal
      open={open}
      width={820}
      title={document.title}
      footer={null}
      centered
      onCancel={onClose}
      maskStyle={modalMaskStyle}
      maskTransitionName={modalMaskTransitionName}
      transitionName=''
      rootClassName={styles.modalRoot}
      className={styles.modal}
      destroyOnHidden
    >
      <SimpleBar className={cn(styles.scroll, 'dtPrettyScrollbar')} autoHide>
        <div className={styles.document}>
          <div className={styles.meta}>
            <span>生效日期：{document.effectiveDate}</span>
            <span>更新日期：{document.updatedAt}</span>
          </div>

          {document.intro.map((paragraph) => (
            <Paragraph key={paragraph} className={styles.paragraph}>
              {paragraph}
            </Paragraph>
          ))}

          {document.sections.map((section) => (
            <section key={section.title} className={styles.section}>
              <Title level={4}>{section.title}</Title>
              {section.paragraphs?.map((paragraph) => (
                <Paragraph key={paragraph} className={styles.paragraph}>
                  {paragraph}
                </Paragraph>
              ))}
              {section.items && (
                <ul className={styles.list}>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </SimpleBar>
    </Modal>
  )
}

export default LegalModal
