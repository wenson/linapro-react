import Avatar from "@douyinfe/semi-ui/lib/es/avatar";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Modal from "@douyinfe/semi-ui/lib/es/modal";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import Cropper from "cropperjs";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { canvasToBlob } from "#/features/profile/avatar-utils";

export function AvatarCropper({
  avatar,
  onUpload,
}: {
  avatar: string;
  onUpload(blob: Blob, filename: string): Promise<void>;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const [source, setSource] = useState("");
  const [filename, setFilename] = useState("avatar.png");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!source || !imageRef.current) {
      return;
    }
    const cropper = new Cropper(imageRef.current, {
      aspectRatio: 1,
      autoCropArea: 1,
      viewMode: 1,
    });
    cropperRef.current = cropper;
    return () => {
      cropper.destroy();
      cropperRef.current = null;
    };
  }, [source]);

  function close() {
    if (source) {
      URL.revokeObjectURL(source);
    }
    setSource("");
    setError("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function confirm() {
    const cropper = cropperRef.current;
    if (!cropper) {
      return;
    }
    setUploading(true);
    setError("");
    try {
      const blob = await canvasToBlob(cropper.getCroppedCanvas({ height: 512, width: 512 }));
      await onUpload(blob, filename);
      close();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("pages.profile.avatar.uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="avatar-cropper">
      <Avatar alt={t("pages.profile.avatar.current")} size="extra-large" src={avatar} />
      <input
        accept="image/jpeg,image/png,image/webp"
        aria-label={t("pages.profile.avatar.select")}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (file.size > 5 * 1024 * 1024) {
            setError(t("pages.profile.avatar.tooLarge"));
            return;
          }
          setFilename(file.name);
          setSource(URL.createObjectURL(file));
        }}
        ref={inputRef}
        type="file"
      />
      <Button onClick={() => inputRef.current?.click()} theme="borderless">
        {t("pages.profile.avatar.change")}
      </Button>
      <Modal
        cancelButtonProps={{ "aria-label": t("pages.common.cancel") }}
        cancelText={t("pages.common.cancel")}
        confirmLoading={uploading}
        okText={t("pages.profile.avatar.upload")}
        okButtonProps={{ "aria-label": t("pages.profile.avatar.upload") }}
        onCancel={close}
        onOk={() => void confirm()}
        title={t("pages.profile.avatar.cropTitle")}
        visible={!!source}
      >
        {source ? <img alt={t("pages.profile.avatar.cropPreview")} className="avatar-crop-image" ref={imageRef} src={source} /> : null}
        {error ? <Typography.Text role="alert" type="danger">{error}</Typography.Text> : null}
      </Modal>
    </div>
  );
}
