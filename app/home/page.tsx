"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { NavBar } from "../components/navbar";
import StudentNavBar from "../components/student-navbar";
import { getDocumentTypesApi, getMfaStatusApi, createRequestApi } from "../api/auth_service";
import { CreateRequestRequest } from "../api/interface/request/create_request";
import { DocumentType } from "../api/interface/response/get_document_types";
import { requestDocumentApi, getCertificatesApi } from "../api/document_service";
import { CertificateResponse } from "../api/interface/response/certificates";
import { Card, Spin, Input, Modal, Button, Empty, Alert, Select, Descriptions, Divider, Form } from "antd";
import { FileTextOutlined, SafetyCertificateOutlined, TrophyOutlined, FileSearchOutlined, PlusOutlined } from "@ant-design/icons";

type CategoryType = "certificate" | "diploma" | "transcript" | "all";

const HomePage = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const [allDocumentTypes, setAllDocumentTypes] = useState<DocumentType[]>([]);
  const [filteredDocumentTypes, setFilteredDocumentTypes] = useState<DocumentType[]>([]);
  const [currentCategory, setCurrentCategory] = useState<CategoryType | null>(null);
  const [loadingTypes, setLoadingTypes] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [certificates, setCertificates] = useState<CertificateResponse[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);
  const [loadingCertificates, setLoadingCertificates] = useState<boolean>(false);
  const [mfaCode, setMfaCode] = useState<string>("");
  const [requestLoading, setRequestLoading] = useState<boolean>(false);
  const [isRequestModalVisible, setIsRequestModalVisible] = useState<boolean>(false);
  const [isCreateRequestModalVisible, setIsCreateRequestModalVisible] = useState<boolean>(false);
  const [createRequestForm] = Form.useForm();
  const [createRequestMfaCode, setCreateRequestMfaCode] = useState<string>("");
  const [createRequestLoading, setCreateRequestLoading] = useState<boolean>(false);
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(false);

  // useEffect(() => {
  //   if (!loading && !isAuthenticated) {
  //     router.replace("/login");
  //   }

  //   if (!loading && user?.role != "student") {
  //     Swal.fire({
  //       icon: "question",
  //       title: "Bạn không có quyền truy cập trang này!",
  //       text: "Trang hiện tại chỉ dành cho sinh viên. Tự động quay về trang manager dashboard",
  //     });

  //     router.replace("manager/dashboard");
  //   }
  // }, [loading, isAuthenticated, router, user]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "student") {
      fetchDocumentTypes();
      checkMfaStatus();
    }
  }, [isAuthenticated, user]);

  const checkMfaStatus = async () => {
    try {
      const mfaStatus = await getMfaStatusApi();
      setMfaEnabled(mfaStatus.isEnabled);
    } catch (error) {
      console.error("Failed to check MFA status:", error);
    }
  };

  const fetchDocumentTypes = async () => {
    setLoadingTypes(true);
    try {
      const response = await getDocumentTypesApi();
      const types = response.documentTypes || [];
      setAllDocumentTypes(types);
      setFilteredDocumentTypes(types);
    } catch (error: any) {
      console.error("Failed to fetch document types:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: error.response?.data?.message || "Không thể tải danh sách loại tài liệu!",
      });
    } finally {
      setLoadingTypes(false);
    }
  };

  const filterByCategory = (category: CategoryType) => {
    setCurrentCategory(category);
    
    if (category === "all") {
      setFilteredDocumentTypes(allDocumentTypes);
      return;
    }

    const filtered = allDocumentTypes.filter((docType) => {
      const name = docType.document_type_name.toLowerCase();
      
      if (category === "certificate") {
        return name.includes("certificate") || name.includes("chứng chỉ");
      }
      
      if (category === "diploma") {
        return (
          name.includes("diploma") ||
          name.includes("bằng tốt nghiệp") ||
          name.includes("bằng")
        );
      }
      
      if (category === "transcript") {
        return (
          name.includes("transcript") ||
          name.includes("bảng điểm") ||
          name.includes("học bạ")
        );
      }
      
      return false;
    });
    
    setFilteredDocumentTypes(filtered);
  };

  const handleCategoryClick = async (category: CategoryType) => {
    if (category === "certificate" || category === "diploma") {
      // Với certificate và diploma, cần load certificates và hiển thị select
      setCurrentCategory(category);
      setLoadingCertificates(true);
      try {
        // Tìm document_type_id tương ứng
        const docType = allDocumentTypes.find((dt) => {
          const name = dt.document_type_name.toLowerCase();
          if (category === "certificate") {
            return name.includes("certificate") || name.includes("chứng chỉ");
          }
          if (category === "diploma") {
            return name.includes("diploma") || name.includes("bằng tốt nghiệp") || name.includes("bằng");
          }
          return false;
        });

        if (docType) {
          const certs = await getCertificatesApi(docType.document_type_id);
          setCertificates(certs);
          setSelectedType(docType);
        } else {
          Swal.fire({
            icon: "warning",
            title: "Không tìm thấy",
            text: "Không tìm thấy loại tài liệu tương ứng.",
          });
        }
      } catch (error: any) {
        console.error("Failed to fetch certificates:", error);
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: error.response?.data?.message || "Không thể tải danh sách chứng chỉ!",
        });
      } finally {
        setLoadingCertificates(false);
      }
    } else {
      // Với transcript và all, filter document types như bình thường
      filterByCategory(category);
    }
  };

  const getDocumentIcon = (typeName: string) => {
    const name = typeName.toLowerCase();
    if (name.includes("certificate") || name.includes("chứng chỉ")) {
      return <SafetyCertificateOutlined style={{ fontSize: 48, color: "#1890ff" }} />;
    }
    if (name.includes("diploma") || name.includes("bằng tốt nghiệp") || name.includes("bằng")) {
      return <TrophyOutlined style={{ fontSize: 48, color: "#52c41a" }} />;
    }
    if (name.includes("transcript") || name.includes("bảng điểm") || name.includes("học bạ")) {
      return <FileSearchOutlined style={{ fontSize: 48, color: "#faad14" }} />;
    }
    return <FileTextOutlined style={{ fontSize: 48, color: "#722ed1" }} />;
  };

  const isDiplomaOrTranscript = (typeName: string) => {
    const name = typeName.toLowerCase();
    return (
      name.includes("diploma") ||
      name.includes("bằng tốt nghiệp") ||
      name.includes("bằng") ||
      name.includes("transcript") ||
      name.includes("bảng điểm") ||
      name.includes("học bạ")
    );
  };

  const checkMfaAndProceed = async (callback: () => void) => {
    try {
      const mfaStatus = await getMfaStatusApi();
      if (!mfaStatus.isEnabled) {
        Swal.fire({
          icon: "warning",
          title: "MFA chưa được kích hoạt",
          text: "Bạn cần kích hoạt MFA để thực hiện tác vụ này. Sẽ chuyển đến trang cài đặt MFA.",
          confirmButtonText: "Đi đến cài đặt",
        }).then(() => {
          router.push("/profile");
        });
        return false;
      }
      callback();
      return true;
    } catch (error: any) {
      console.error("Failed to check MFA status:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể kiểm tra trạng thái MFA. Vui lòng thử lại.",
      });
      return false;
    }
  };

  const handleCertificateSelect = async (certificateId: string) => {
    const proceed = await checkMfaAndProceed(() => {
      setSelectedCertificate(certificateId);
      setIsRequestModalVisible(true);
    });
    if (!proceed) return;
  };

  const handleRequestClick = async (docType: DocumentType) => {
    // Check MFA first
    const proceed = await checkMfaAndProceed(() => {
      setSelectedType(docType);
      setMfaCode("");
      setSelectedCertificate(null);
      
      // Hiển thị popup xác nhận cho transcript
      if (isDiplomaOrTranscript(docType.document_type_name) && currentCategory !== "certificate" && currentCategory !== "diploma") {
        Swal.fire({
          title: "Xác nhận yêu cầu",
          html: `
            <div style="text-align: left;">
              <p><strong>Loại tài liệu:</strong> ${docType.document_type_name}</p>
              <p><strong>Mô tả:</strong> ${docType.description || "Không có mô tả"}</p>
              <p style="color: #ff4d4f; margin-top: 10px;">
                <strong>⚠️ Lưu ý:</strong> Bạn có chắc chắn muốn yêu cầu tài liệu này?
              </p>
            </div>
          `,
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Xác nhận",
          cancelButtonText: "Hủy",
          confirmButtonColor: "#1890ff",
        }).then((result) => {
          if (result.isConfirmed) {
            setIsRequestModalVisible(true);
          }
        });
      } else {
        // Với các loại khác, mở modal luôn
        setIsRequestModalVisible(true);
      }
    });
    if (!proceed) return;
  };

  const handleRequestSubmit = async () => {
    if (!selectedType) return;

    // Với certificate và diploma, cần có selectedCertificate
    if ((currentCategory === "certificate" || currentCategory === "diploma") && !selectedCertificate) {
      Swal.fire({
        icon: "warning",
        title: "Chưa chọn chứng chỉ",
        text: "Vui lòng chọn chứng chỉ trước khi yêu cầu.",
      });
      return;
    }

    if (!mfaCode || mfaCode.trim().length !== 6) {
      Swal.fire({
        icon: "warning",
        title: "Mã MFA không hợp lệ",
        text: "Vui lòng nhập mã xác thực MFA 6 chữ số.",
      });
      return;
    }

    setRequestLoading(true);
    try {
      await requestDocumentApi({
        document_type_id: selectedType.document_type_id,
        authenticator_code: mfaCode.trim(),
        certificate_id: selectedCertificate || undefined,
      });

      Swal.fire({
        icon: "success",
        title: "Yêu cầu thành công",
        text: `Đã gửi yêu cầu tài liệu "${selectedType.document_type_name}". Vui lòng chờ phê duyệt.`,
      });

      setIsRequestModalVisible(false);
      setSelectedType(null);
      setSelectedCertificate(null);
      setMfaCode("");
      setCurrentCategory(null);
    } catch (error: any) {
      console.error("Failed to request document:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Không thể gửi yêu cầu tài liệu!";
      
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: errorMessage,
      });
    } finally {
      setRequestLoading(false);
    }
  };

  const handleCloseRequestModal = () => {
    setIsRequestModalVisible(false);
    setSelectedType(null);
    setSelectedCertificate(null);
    setMfaCode("");
  };

  const handleCreateRequest = async (values: any) => {
    if (!mfaEnabled) {
      Swal.fire({
        icon: "warning",
        title: "MFA chưa được kích hoạt",
        text: "Bạn cần kích hoạt MFA để tạo yêu cầu. Sẽ chuyển đến trang cài đặt MFA.",
        confirmButtonText: "Đi đến cài đặt",
      }).then(() => {
        router.push("/profile");
      });
      return;
    }

    const payload: CreateRequestRequest = {
      content: values.content,
      authenticator_code: createRequestMfaCode.trim() || undefined,
    };

    setCreateRequestLoading(true);
    try {
      await createRequestApi(payload);
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Yêu cầu đã được tạo thành công!",
      });
      setIsCreateRequestModalVisible(false);
      createRequestForm.resetFields();
      setCreateRequestMfaCode("");
    } catch (error: any) {
      console.error("Failed to create request:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: error.response?.data?.message || "Không thể tạo yêu cầu!",
      });
    } finally {
      setCreateRequestLoading(false);
    }
  };

  if (loading || (!loading && !isAuthenticated)) {
    return (
      <div className="flex items-center justify-center w-full py-20">
        <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-screen bg-gray-50">
      <NavBar />
      <StudentNavBar />
      <div className="w-[90vw] mx-auto py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Yêu cầu tài liệu
            </h1>
            <p className="text-gray-600">
              Chọn loại tài liệu bạn muốn yêu cầu
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateRequestModalVisible(true)}
            size="large"
          >
            Tạo yêu cầu mới
          </Button>
        </div>

        {loadingTypes ? (
          <div className="flex justify-center items-center py-20">
            <Spin size="large" />
          </div>
        ) : allDocumentTypes.length === 0 ? (
          <Empty description="Không có loại tài liệu nào" />
        ) : (
          <>
            {currentCategory === null ? (
              // Hiển thị categories
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                  hoverable
                  className="rounded-xl shadow-md transition-all duration-200 hover:shadow-lg cursor-pointer"
                  onClick={() => handleCategoryClick("certificate")}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4">
                      <SafetyCertificateOutlined style={{ fontSize: 64, color: "#1890ff" }} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Chứng chỉ
                    </h3>
                    <p className="text-sm text-gray-600">
                      Xem các loại chứng chỉ có sẵn
                    </p>
                  </div>
                </Card>
                
                <Card
                  hoverable
                  className="rounded-xl shadow-md transition-all duration-200 hover:shadow-lg cursor-pointer"
                  onClick={() => handleCategoryClick("diploma")}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4">
                      <TrophyOutlined style={{ fontSize: 64, color: "#52c41a" }} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Bằng tốt nghiệp
                    </h3>
                    <p className="text-sm text-gray-600">
                      Xem các loại bằng tốt nghiệp
                    </p>
                  </div>
                </Card>
                
                <Card
                  hoverable
                  className="rounded-xl shadow-md transition-all duration-200 hover:shadow-lg cursor-pointer"
                  onClick={() => handleCategoryClick("transcript")}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4">
                      <FileSearchOutlined style={{ fontSize: 64, color: "#faad14" }} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Bảng điểm
                    </h3>
                    <p className="text-sm text-gray-600">
                      Xem các loại bảng điểm
                    </p>
                  </div>
                </Card>
                
                <Card
                  hoverable
                  className="rounded-xl shadow-md transition-all duration-200 hover:shadow-lg cursor-pointer"
                  onClick={() => handleCategoryClick("all")}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4">
                      <FileTextOutlined style={{ fontSize: 64, color: "#722ed1" }} />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Tất cả
                    </h3>
                    <p className="text-sm text-gray-600">
                      Xem tất cả loại tài liệu
                    </p>
                  </div>
                </Card>
              </div>
            ) : (currentCategory === "certificate" || currentCategory === "diploma") ? (
              // Hiển thị select certificate cho certificate và diploma
              <div>
                <div className="mb-4 flex items-center gap-4">
                  <Button
                    onClick={() => {
                      setCurrentCategory(null);
                      setSelectedType(null);
                      setSelectedCertificate(null);
                      setCertificates([]);
                    }}
                    icon={<span>←</span>}
                  >
                    Quay lại
                  </Button>
                  <h2 className="text-xl font-semibold text-gray-700">
                    {currentCategory === "certificate" && "Chọn chứng chỉ"}
                    {currentCategory === "diploma" && "Chọn bằng tốt nghiệp"}
                  </h2>
                </div>
                
                {loadingCertificates ? (
                  <div className="flex justify-center items-center py-20">
                    <Spin size="large" />
                  </div>
                ) : certificates.length === 0 ? (
                  <Empty description="Không có chứng chỉ nào trong danh mục này" />
                ) : (
                  <div className="max-w-2xl">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn chứng chỉ
                      </label>
                      <Select
                        placeholder="Chọn chứng chỉ"
                        className="w-full"
                        size="large"
                        value={selectedCertificate}
                        onChange={handleCertificateSelect}
                        options={certificates.map((cert) => ({
                          value: cert.certificate_id,
                          label: `${cert.certificate_name || cert.document_type_name} - Ngày cấp: ${cert.issued_date}${cert.expiry_date ? ` - Hết hạn: ${cert.expiry_date}` : ""}`,
                        }))}
                      />
                    </div>
                    {selectedCertificate && (
                      <Card className="mt-4">
                        <div className="space-y-2">
                          <p><strong>Tên chứng chỉ:</strong> {certificates.find(c => c.certificate_id === selectedCertificate)?.certificate_name || certificates.find(c => c.certificate_id === selectedCertificate)?.document_type_name}</p>
                          <p><strong>Loại:</strong> {certificates.find(c => c.certificate_id === selectedCertificate)?.document_type_name}</p>
                          <p><strong>Ngày cấp:</strong> {certificates.find(c => c.certificate_id === selectedCertificate)?.issued_date}</p>
                          {certificates.find(c => c.certificate_id === selectedCertificate)?.expiry_date && (
                            <p><strong>Hết hạn:</strong> {certificates.find(c => c.certificate_id === selectedCertificate)?.expiry_date}</p>
                          )}
                          {certificates.find(c => c.certificate_id === selectedCertificate)?.description && (
                            <p><strong>Mô tả:</strong> {certificates.find(c => c.certificate_id === selectedCertificate)?.description}</p>
                          )}
                        </div>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Hiển thị filtered document types cho transcript và all
              <div>
                <div className="mb-4 flex items-center gap-4">
                  <Button
                    onClick={() => {
                      setCurrentCategory(null);
                      setFilteredDocumentTypes(allDocumentTypes);
                    }}
                    icon={<span>←</span>}
                  >
                    Quay lại
                  </Button>
                  <h2 className="text-xl font-semibold text-gray-700">
                    {currentCategory === "transcript" && "Bảng điểm"}
                    {currentCategory === "all" && "Tất cả tài liệu"}
                  </h2>
                </div>
                
                {filteredDocumentTypes.length === 0 ? (
                  <Empty description="Không có tài liệu nào trong danh mục này" />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredDocumentTypes.map((docType) => (
                      <Card
                        key={docType.document_type_id}
                        hoverable
                        className="rounded-xl shadow-md transition-all duration-200 hover:shadow-lg"
                        onClick={() => handleRequestClick(docType)}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="mb-4">
                            {getDocumentIcon(docType.document_type_name)}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            {docType.document_type_name}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {docType.description || "Không có mô tả"}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        title={`Yêu cầu tài liệu: ${selectedType?.document_type_name || ""}`}
        open={isRequestModalVisible}
        onCancel={handleCloseRequestModal}
        footer={[
          <Button key="cancel" onClick={handleCloseRequestModal}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleRequestSubmit}
            loading={requestLoading}
            disabled={!mfaCode || mfaCode.trim().length !== 6 || ((currentCategory === "certificate" || currentCategory === "diploma") && !selectedCertificate)}
          >
            Gửi yêu cầu
          </Button>,
        ]}
        width={500}
        destroyOnHidden
      >
        {selectedType && (
          <div className="space-y-4">
            <Alert
              title="Yêu cầu mã xác thực MFA"
              description="Vui lòng nhập mã xác thực 6 chữ số từ ứng dụng Authenticator của bạn."
              type="info"
              showIcon
            />
            {(currentCategory === "certificate" || currentCategory === "diploma") && selectedCertificate && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Thông tin chứng chỉ đã chọn
                </label>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  {(() => {
                    const selectedCert = certificates.find(c => c.certificate_id === selectedCertificate);
                    if (!selectedCert) return null;
                    
                    return (
                      <Descriptions
                        column={1}
                        size="small"
                        bordered
                        className="bg-white rounded"
                      >
                        <Descriptions.Item label="Tên chứng chỉ" labelStyle={{ fontWeight: 600, width: '40%' }}>
                          {selectedCert.certificate_name || selectedCert.document_type_name}
                        </Descriptions.Item>
                        <Descriptions.Item label="Loại chứng chỉ" labelStyle={{ fontWeight: 600 }}>
                          {selectedCert.document_type_name}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày cấp" labelStyle={{ fontWeight: 600 }}>
                          {selectedCert.issued_date || "N/A"}
                        </Descriptions.Item>
                        {selectedCert.expiry_date && (
                          <Descriptions.Item label="Ngày hết hạn" labelStyle={{ fontWeight: 600 }}>
                            {selectedCert.expiry_date}
                          </Descriptions.Item>
                        )}
                        {selectedCert.description && (
                          <Descriptions.Item label="Mô tả" labelStyle={{ fontWeight: 600 }}>
                            {selectedCert.description}
                          </Descriptions.Item>
                        )}
                        {selectedCert.metadata && Object.keys(selectedCert.metadata).length > 0 && (
                          <Descriptions.Item label="Thông tin bổ sung" labelStyle={{ fontWeight: 600 }}>
                            <div className="text-xs">
                              {Object.entries(selectedCert.metadata).map(([key, value]) => (
                                <div key={key} className="mb-1">
                                  <span className="font-medium">{key}:</span> {String(value)}
                                </div>
                              ))}
                            </div>
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                    );
                  })()}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã xác thực MFA (6 chữ số)
              </label>
              <Input
                type="text"
                maxLength={6}
                placeholder="Nhập mã MFA"
                value={mfaCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setMfaCode(value);
                }}
                className="w-full"
              />
            </div>
            <Divider />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thông tin loại tài liệu
              </label>
              <Descriptions
                column={1}
                size="small"
                bordered
                className="bg-gray-50 rounded"
              >
                <Descriptions.Item label="Loại tài liệu" labelStyle={{ fontWeight: 600, width: '40%' }}>
                  {selectedType.document_type_name}
                </Descriptions.Item>
                {selectedType.description && (
                  <Descriptions.Item label="Mô tả" labelStyle={{ fontWeight: 600 }}>
                    {selectedType.description}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>
          </div>
        )}
          </Modal>

          {/* Create Request Modal */}
          <Modal
            title="Tạo yêu cầu mới"
            open={isCreateRequestModalVisible}
            onCancel={() => {
              setIsCreateRequestModalVisible(false);
              createRequestForm.resetFields();
              setCreateRequestMfaCode("");
            }}
            footer={null}
            width={600}
            destroyOnHidden
          >
            <Form form={createRequestForm} onFinish={handleCreateRequest} layout="vertical">
              <Form.Item
                name="content"
                label="Nội dung yêu cầu"
                rules={[{ required: true, message: "Vui lòng nhập nội dung yêu cầu!" }]}
              >
                <Input.TextArea rows={6} placeholder="Nhập nội dung yêu cầu..." />
              </Form.Item>
              {mfaEnabled && (
                <Form.Item
                  label="Mã xác thực MFA (6 chữ số)"
                  rules={[{ required: true, message: "Vui lòng nhập mã MFA!" }]}
                >
                  <Input
                    type="text"
                    maxLength={6}
                    placeholder="Nhập mã MFA"
                    value={createRequestMfaCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setCreateRequestMfaCode(value);
                    }}
                  />
                </Form.Item>
              )}
              <Form.Item>
                <div className="flex justify-end gap-2">
                  <Button onClick={() => {
                    setIsCreateRequestModalVisible(false);
                    createRequestForm.resetFields();
                    setCreateRequestMfaCode("");
                  }}>
                    Hủy
                  </Button>
                  <Button type="primary" htmlType="submit" loading={createRequestLoading}>
                    Tạo yêu cầu
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      );
    };
    
    export default HomePage;