import React, { useEffect, useReducer, useState } from "react";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import { Button, Card, Col, Form, Modal, Row } from "react-bootstrap";
import Seo from "../../../../shared/layout-components/seo/seo";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import active from "../../../../public/assets/img/active.png";
import card from "../../../../public/assets/img/card.svg";
import receipt from "../../../../public/assets/img/receipt.svg";
import socument from "../../../../public/assets/img/socument.svg";
import { getUserCookies } from "../../../../utils/getUserCookies";
import dynamic from "next/dynamic";
import logout from "../../../../utils/logout";

const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
});
const DataTableExtensions = dynamic(
  () => import("react-data-table-component-extensions"),
  { ssr: false },
);


let html2pdf;
if (typeof window !== 'undefined') {
  html2pdf = require('html2pdf.js');
}
const user = getUserCookies();

const Orders = () => {
  const router = useRouter();
  const { id } = router.query;

  const { token, id: adminId, user_type } = user;
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const [data, setData] = useState(null);
  const [reciteData, setReciteData] = useState([]);
  const [currentReciteAmount, setCurrentReciteAmount] = useState(0);
  const [currentRecite, srtCurrentRecite] = useState();
  const [specs, setSpecs] = useState([]);
  const [submitPopup, setSubmitPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitRecitePopup, setSubmitRecitePopup] = useState(false);
  const [editeRecitePopup, setEditeRecitePopup] = useState(false);
  const [showRecitePopup, setShowRecitePopup] = useState(false);
  const [amounts, setAmounts] = useState({})
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [isCanUpdateAndConfirmRecite, setIsCanUpdateAndConfirmRecite] = useState(false);
  const [isCanUpdate, setIsCanUpdate] = useState(false);
  const [isCanShowPurchasesFiles, setIsCanShowPurchasesFiles] = useState(false);
  const [showAddFileModal, setShowAddFileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [showViewFileModal, setShowViewFileModal] = useState(false);
  const [currentViewFile, setCurrentViewFile] = useState(null);
  useEffect(() => {
    if (user_type === "ACC") {
      const permissions = JSON.parse(localStorage.getItem("permissions"))
      const componentPermissions = permissions?.filter(
        (permission) => permission.group_name === 'مبيعات الاستلام'
      );
      const canUpdateAndConfirmRecite = componentPermissions?.some((permission) => permission.display_name === 'تأكيد وتعديل مبلغ الإيصال');
      const canUpdate = componentPermissions?.some((permission) => permission.display_name === 'تعديل');
      const showPurchasesFiles = componentPermissions?.some((permission) => permission.display_name === "عرض مستندات الشراء");
      setIsCanUpdateAndConfirmRecite(canUpdateAndConfirmRecite);
      setIsCanShowPurchasesFiles(showPurchasesFiles);
      setIsCanUpdate(canUpdate);
    }
  }, [user]);
  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/v1/purchase-documents/?purchase=${id}&purchase_type=PURCHASE_AND_PICK`, {
        headers: { "Authorization": token }
      });

      if (response.status === 401) {
        logout();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };
  useEffect(() => {
    fetch(
      `${baseUrl}/api/v1/admin/purchasing_pick_process/${id}/?admin_id=${adminId}`,
      {
        headers: {
          Authorization: token,
        },
      },
    )
      .then((res) => {
        if (res.status === 401) {
          logout();
          return;
        }
        if (res.status === 403) {

          return;
        }
        return res.json();
      })
      .then((data) => {
        console.log(data);
        setData(data);
        setSpecs(data.package_specs);
        const initAmounts = {};
        setReciteData(
          data?.Receipt?.map((el) => {
            initAmounts[el.id] = el.amount;
            el.editable = el.amount > 0 ? false : true
            return el

          })
        )
        setAmounts(initAmounts)
      });
    fetchDocuments();
  }, [adminId, id, token, update]);
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }
    setLoading(true)
    const formData = new FormData();
    formData.append("purchase", id);
    formData.append("purchase_type", "PURCHASE_AND_PICK");
    formData.append("document", selectedFile);

    try {
      const response = await fetch(`${baseUrl}/api/v1/purchase-documents/`, {
        method: "POST",
        headers: {
          "Authorization": token,
        },
        body: formData,
      });

      if (response.ok) {
        toast.success("تم رفع الملف بنجاح");
        setShowAddFileModal(false);
        setSelectedFile(null);
        fetchDocuments(); // Refresh documents list
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to upload file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("An error occurred while uploading the file");
    }
    setLoading(false)
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;

    try {
      const response = await fetch(`${baseUrl}/api/v1/purchase-documents/${documentToDelete.id}/`, {
        method: "DELETE",
        headers: {
          "Authorization": token,
        },
      });

      if (response.ok) {
        toast.success("تم حذف الملف بنجاح");
        fetchDocuments(); // Refresh documents list
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete document");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("An error occurred while deleting the document");
    } finally {
      setShowDeleteConfirm(false);
      setDocumentToDelete(null);
    }
  };
  //* Get Purchase Details
  const handleSetSubmitPopup = () => {
    if (!data?.remaining_amount > 0) {
      toast.error("   لم يتم دفع المبلغ بالكامل  ");

    }
    else {
      setSubmitPopup(true)
    }
  }


  const columns = [
    {
      name: "الايصال",
      selector: (row) => [row?.created_at],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'><span className="font-weight-bold">ايصال</span> {row?.created_at.split("T")[0]} </span>
        </div>
      ),

      sortable: true,
    },
    {
      name: "الملف",
      selector: (row) => [+row?.id],
      sortable: true,
      cell: (row) => (
        <div
          onClick={() => {

            setShowRecitePopup(true)
            srtCurrentRecite(row)

          }
          }
          className='font-weight-bold text-primary cursor-pointer '>عرض الملف</div>
      ),
    },

    {
      name: "المبلغ",
      selector: (row) => [row?.amount],
      cell: (row) => (
        <div className='font-weight-bold d-flex justify-content-center'>

          <span >

            <input onChange={(e) => { setCurrentReciteAmount(e.target.value); const cAmount = {}; cAmount[row.id] = e.target.amount; setAmounts({ ...amounts, ...cAmount }) }} className={!row?.editable ? "bg-light form-control " : " border  "} type="text" name="" id="" readOnly={!row?.editable} value={amounts[row?.id] ? (!row?.editable ? amounts[row?.id].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : amounts[row?.id]) : null} />
          </span>
        </div>
      ),
      sortable: true,
    },
    user_type === "ADM" || isCanUpdateAndConfirmRecite ?
      {
        name: "التأكيد",
        selector: (row) => [row?.amount],
        sortable: true,
        cell: (row) => (
          <div className='font-weight-bold'>
            {!row?.editable && row?.amount ?

              <Button disabled={data?.status == "PAID" ? true : false}

                onClick={() => {

                  srtCurrentRecite(row)
                  setEditeRecitePopup(true)
                  console.log(row);



                }
                }
              >
                تعديل القيمة

              </Button>
              :
              <Button disabled={data?.status == "PAID" ? true : false}

                onClick={() => {

                  setSubmitRecitePopup(true)
                  srtCurrentRecite(row)



                }
                }
              >
                تأكيد وتسجيل القيمة

              </Button>

            }
          </div>
        ),
      } : '',
    // {
    //   name: "الكمية",
    //   selector: (row) => [row?.quantity],
    //   sortable: true,
    //   cell: (row) => <div>{row?.quantity}</div>,
    // },


  ];

  const tableData = {
    columns,
    data: reciteData,
  };
  const documentsColumns = [
    {
      name: "#",
      selector: (row) => row.document_name,
      cell: (row) => (
        <a 
          href="#" 
        
        >
          {row?.id}
        </a>
      ),
      sortable: true,
    },
    {
      name: "تاريخ الرفع",
      selector: (row) => row.created_at,
      cell: (row) => {
        // Format the date to be more readable
        const date = new Date(row.created_at);
        const formattedDate = date.toLocaleDateString('ar-EG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        return (
          <div>
            <div>{formattedDate}</div>
          
          </div>
        );
      },
      sortable: true,
      
    },
    {
      name: "الإجراءات",
      cell: (row) => (
        <div className="d-flex gap-2">
          <Button
            variant="info"
            size="sm"
            onClick={() => {
              setCurrentViewFile(row);
              setShowViewFileModal(true);
            }}
          >
            عرض
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setDocumentToDelete(row);
              setShowDeleteConfirm(true);
            }}
          >
            حذف
          </Button>
        </div>
      ),
    },
  ];
  const documentsTableData = {
    columns: documentsColumns,
    data: documents,
  };
  const getMarktingContract = (status) => {
    switch (status) {
      case "NEW":
        return 0
      case "PAID":
        return 0;
      case "REJECTED":
        return 0;
      case "SOLD":
        return 1;
      case "PENDING":
        return 0;
      case "UPLOADED_FILE":
        return 0;
      case "SOLD_PARTIALLY":
        return 0; // Example, change as needed
      case "CANCELLED":
        return 0;
      default:
        return 0; // Default color
    }
  };
  const getSellingContract = (status) => {
    switch (status) {
      case "NEW":
        return 0
      case "PAID":
        return 1;
      case "REJECTED":
        return 0;
      case "SOLD":
        return 1;
      case "PENDING":
        return 0;
      case "UPLOADED_FILE":
        return 0;
      case "SOLD_PARTIALLY":
        return 1; // Example, change as needed
      case "CANCELLED":
        return 0;
      default:
        return 0; // Default color
    }
  };


  const [modalContent, setModalContent] = useState('');
  const [showModal, setShowModal] = useState(false);
  const showMarketingContract = getMarktingContract(data?.status);
  const showSellingContract = getSellingContract(data?.status);
  const handleApiResponse = (responseContent) => {
    setModalContent(responseContent);
    setShowModal(true);
  };

  const handlePurchaseRecipte = (base) => {
    if (showSellingContract) {
      fetch(`${baseUrl}/docs/${base}/?user_id=${data?.user_id}&purchase_id=${data?.id}`, {
        headers: { Authorization: token }
      })
        .then((res) => res.text())
        .then((html) => {
          handleApiResponse(html);
        });
    } else {
      toast.error('  الفاتورة غير متوفرة بعد  ');
    }
  };



  const printDocument = () => {
    const element = document.getElementById('modal-content');
    const opt = {
      margin: 0,
      filename: 'download.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save();
  };

  return (
    <>
      <Seo title='مبيعات الاستلام' />

      <PageHeader
        title='مبيعات الاستلام'
        item='شركة وحيد'
        active_item={"مبيعات الاستلام"}
      />

      <div>
        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 pb-0'>
                <div className="d-flex flex-wrap justify-content-end gap-2 ">
                  {
                    user_type === "ADM" || isCanUpdate ?
                      <>


                        <Button
                          className='mx-3'
                          onClick={() => setShowAddFileModal(true)}
                        >
                          إرفاق مستند
                        </Button>

                      </>
                      :
                      ''

                  }
                </div>
                <div>
                  <div className='d-flex justify-content-between'>
                    <label className='main-content-label my-auto pt-2'>
                      تفاصيل مبيعة الاستلام
                    </label>
                    {/* <div className='actions'>
                      <Link
                        className='btn btn-primary'
                        href={
                          "/dashboard/pages/users/" + data?.user_id + "/"
                        }
                      >
                        معلومات المشتري
                      </Link>
                      
                    </div> */}
                  </div>
                </div>
              </Card.Header>
              <Card.Body className=' d-flex gap-3 justify-content-between'>
                <div className=' d-flex flex-1 flex-column gap-3'>
                  {/* <label className="app-label">{"عملية شراء: " + data?.Package?.title}</label> */}

                  <label
                    className='app-label'

                  >
                    المعرف: {data?.id}
                  </label>
                  <label
                    className='app-label'

                  >
                    المشتري: {data?.user?.name}
                  </label>
                  <label className='app-label'>
                    {" "}
                    رقم الجوال: {data?.user?.mobile}
                  </label>
                  <Link
                    className='app-label'
                    href={
                      "/dashboard/pages/packages/" + data?.package?.id + "/"
                    }
                  >
                    الباقة: {data?.package?.title}
                  </Link>
                  <label className='app-label'> الكمية: {data?.quantity}</label>

                  <label className='app-label'> الربح: {data?.profit}</label>
                  {/* <label className="app-label"> نقاط البيع: {data?.sale_pointer}</label> */}
                  <label className='app-label'>
                    {" "}
                    نسبة الضريبة: {data?.vat_percentage}
                  </label>
                  <label className='app-label'>
                    {" "}
                    الحالة:{" "}
                    {data?.status === "NEW"
                      ? "جديد غير مدفوع"
                      : data?.status === "PAID"
                        ? "مدفوعة"
                        : data?.status === "REJECTED"
                          ? "مرفوضة"
                          : data?.status === "SOLD"
                            ? "مبيعة كاملة"
                            : data?.status === "PENDING"
                              ? "انتظار"
                              : data?.status === "UPLOADED_FILE"
                                ? "تم رفع الإيصال"
                                : data?.status === "SOLD_PARTIALLY"
                                  ? "قائمة"
                                  : data?.status === "PAID_PARTIALLY"
                                    ? "مدفوع جزئيا"
                                    : data?.status === "PAYMENT_INITIATED"
                                      ? " تمت محاولة الدفع"
                                      : data?.status}
                  </label>

                  {data?.Receipt?.file && (
                    <>
                      <Link
                        href={"/" + data?.Receipt?.file}
                        target='_blank'
                        referrerPolicy='no-referrer'
                        className='app-label link'
                      >
                        فتح ملف الإيصال بصفحة مستقلة
                      </Link>
                      {/* <iframe src={"/" + data?.Receipt?.file} frameborder="0" height="500"></iframe> */}
                    </>
                  )}

                  <label className='app-label'>
                    {" "}
                    تاريخ الإنشاء:{" "}
                    {new Date(data?.datetime).toLocaleDateString("en-GB")}
                  </label>
                  <label className='app-label'>
                    {" "}
                    السعر الكلي: {data?.total_price}
                  </label>
                </div>
              </Card.Body>
              <Row className='row-sm'>
                <Col md={12} lg={12}>
                  <Card className='custom-card'>
                    <Card.Header className=' border-bottom-0 pb-0'>
                      <div>
                        <div className='d-flex justify-content-between'>
                          <label className='main-content-label my-auto pt-2'>
                            عناصر الباقة
                          </label>
                        </div>
                      </div>
                    </Card.Header>
                    <Card.Body className=' d-flex gap-2 flex-wrap '>
                      {specs?.length > 0 ? (
                        specs?.map((spec) => (
                          <Card
                            className='d-flex flex-1 flex-column gap-3 p-3 my-2 mx-2'
                            style={{ minWidth: "280px" }}
                            key={spec?.id}
                          >


                            <label style={{ lineHeight: "1.7" }} s>
                              {" "}
                              <span className='font-weight-bold '>الكمية:</span>{" "}
                              {spec?.quantity * data.quantity}
                            </label>





                          </Card>
                        ))
                      ) : (
                        <h4>لم يتم إضافة عناصر حتى الان</h4>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <Card.Body>
                <DataTableExtensions {...tableData}>
                  <DataTable
                    columns={columns}
                    defaultSortAsc={false}
                  // striped={true}

                  />
                </DataTableExtensions>
              </Card.Body>
              <div className='actions d-flex-col mb-3 gap-3 ms-4'>
                <div className=' d-flex flex-1 flex-column gap-3 my-4'>

                  <label className='app-label text-primary '> مجموع المدفوعات المؤكدة: {(data?.total_price?.toFixed(3) - data?.remaining_amount?.toFixed(3)).toFixed(3).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</label>
                  <label className='app-label text-primary'>
                    {" "}
                    إجمالي قيمة الشراء: {data?.total_price?.toFixed(3).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </label>


                </div>
                {
                  data?.status !== "PAID" &&
                  (
                    user_type === "ADM" || isCanUpdateAndConfirmRecite ?
                      <Button
                        className='btn-lg btn-success px-5 py-2'
                        onClick={() => handleSetSubmitPopup()}
                      >

                        تأكيد  اكتمال كامل المبلغ

                      </Button> : ''
                  )}
                {/* <button
                  className=' btn-lg btn-danger px-5 py-2'
                  onClick={() => setRejectPopup(true)}
                >
                  رفض
                </button> */}

              </div>
            </Card>
            {/* Add File Modal */}
            <Modal show={showAddFileModal} onHide={() => setShowAddFileModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>إضافة ملف جديد</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form.Group>
                  <Form.Label>اختر ملف</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={handleFileChange}
                  />
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowAddFileModal(false)}>
                  إلغاء
                </Button>
                <Button variant="primary" disabled={loading} onClick={handleFileUpload}>
                  {loading ? 'جار الرفع ....' : 'رفع الملف'}
                </Button>
              </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
              <Modal.Header closeButton>
                <Modal.Title>تأكيد الحذف</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                هل أنت متأكد من حذف هذا الملف؟
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                  إلغاء
                </Button>
                <Button variant="danger" onClick={handleDeleteDocument}>
                  حذف
                </Button>
              </Modal.Footer>
            </Modal>
            {/* View File Modal */}
            <Modal
              show={showViewFileModal}
              onHide={() => setShowViewFileModal(false)}
              size="lg"
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title>عرض الملف: {currentViewFile?.document_name}</Modal.Title>
              </Modal.Header>
              <Modal.Body style={{ minHeight: '500px' }}>
                {currentViewFile && (
                  <div className="w-100 h-100">
                    {currentViewFile.document.endsWith('.pdf') ? (
                      <embed
                        src={`${currentViewFile.document}`}
                        type="application/pdf"
                        width="100%"
                        height="500px"
                      />
                    ) : (
                      <img
                        src={`${currentViewFile.document}`}
                        alt={currentViewFile.document_name}
                        style={{ maxWidth: '100%', maxHeight: '500px' }}
                        className="mx-auto d-block"
                      />
                    )}
                  </div>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  onClick={() => setShowViewFileModal(false)}
                >
                  إغلاق
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    window.open(`${currentViewFile.document}`, '_blank');
                  }}
                >
                  فتح في نافذة جديدة
                </Button>
              </Modal.Footer>
            </Modal>
            {/* Documents Table */}

            <Card className="mt-4">
              <Card.Header className=' border-bottom-0 pb-0'>
                <h3 style={{ color: "var(--primary-bg-color)" }}>الملفات المرفوعة</h3>
              </Card.Header>
              {documents.length > 0 && (
                <Card.Body>
                  <DataTableExtensions {...documentsTableData}>
                    <DataTable
                      columns={documentsColumns}
                      data={documents}
                      defaultSortAsc={false}
                    />
                  </DataTableExtensions>
                </Card.Body>
              )}
            </Card>
            {
              user_type === "ADM" || isCanShowPurchasesFiles ?

                <Row className='row-sm'>
                  <Col md={12} lg={12}>
                    <Card className='custom-card'>
                      <Card.Header className=' border-bottom-0 pb-0'>
                        <div>
                          <div className='d-flex justify-content-between'>
                            <label className='main-content-label my-auto pt-2'>
                              مستندات الشراء
                            </label>
                          </div>
                        </div>
                      </Card.Header>
                      <Card.Body className=' d-flex gap-2 flex-wrap '>
                        <Card className='d-flex  flex-column gap-3 p-3 my-2 mx-2'>
                          <div style={{ cursor: "pointer" }} onClick={() => handlePurchaseRecipte('create_invoice')} className="d-flex gap-5 align-items-center justify-content-center">
                            <span>
                              <img width={80} src={receipt.src} alt="" />
                            </span>
                            <span>
                              فاتورة الشراء
                            </span>

                          </div>
                        </Card>


                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
                : ''
            }
            <Modal show={showModal} onHide={() => setShowModal(false)} size='lg' style={{ overflowX: 'scroll' }}>
              <Modal.Header closeButton>
                <Modal.Title>تفاصيل الفاتورة</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div id="modal-content" dangerouslySetInnerHTML={{ __html: modalContent }}></div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant='secondary' onClick={() => setShowModal(false)}>
                  غلق
                </Button>
                <Button variant='primary' onClick={() => printDocument()}>
                  طباعة
                </Button>
              </Modal.Footer>
            </Modal>
          </Col>
        </Row>
        {submitPopup && (
          <SubmitPopup
            setSubmitPopup={setSubmitPopup}
            purchaseId={data?.id}
            userId={adminId}
            forceUpdate={forceUpdate}
            packageId={data?.package_id}
            token={token}
            user_type={user_type}
          />
        )}
        {submitRecitePopup && (
          <SubmitRecitePopup
            setSubmitRecitePopup={setSubmitRecitePopup}
            purchaseId={id}
            userId={data?.user_id}
            currentRecite={currentRecite}
            setCurrentReciteAmount={setCurrentReciteAmount}
            currentReciteAmount={currentReciteAmount}
            forceUpdate={forceUpdate}
            packageId={data?.package_id}
            token={token}
            user_type={user_type}
          />
        )}
        {showRecitePopup && (
          <ShowRecitePopup
            setShowRecitePopup={setShowRecitePopup}
            purchaseId={id}
            userId={data?.user_id}
            currentRecite={currentRecite}
            currentReciteAmount={currentReciteAmount}
            forceUpdate={forceUpdate}
            packageId={data?.package_id}
            token={token}
          />
        )}
        {editeRecitePopup && (
          <EditeRecitePopup
            setEditeRecitePopup={setEditeRecitePopup}
            setReciteData={setReciteData}
            currentRecite={currentRecite}
            reciteData={reciteData}


          />
        )}
      </div>
    </>
  );
};

Orders.layout = "Contentlayout";

export default Orders;

const SubmitPopup = ({
  setSubmitPopup,
  purchaseId,
  userId,
  packageId,
  forceUpdate,
  token,
  user_type
}) => {
  const [loading, setLoading] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const verifyPurchase = async () => {
    setLoading(true);
    const name = user_type == "ADM" ? 'admin_verifies_payment' : 'accountant_verifies_payment'
    const idName = user_type == "ADM" ? 'user_id' : 'acc_id'
    const res = await fetch(
      `${baseUrl}/api/v1/${name}/?${idName}=${userId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          purchase_id: purchaseId,
          // purchase_type: "hire",
          purchase_type: "pick",
          package_id: packageId,
          oboor_id: "1",
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      },
    );
    if (res.status == 401) {
      logout()
    }
    const data = await res.json();
    if (res.status === 200 && data.success) {
      toast.success("تم القبول بنجاح");
      forceUpdate();
    } else {
      toast.error(data.message || data.error || data.detail || "حدث خطأ ما");
    }
    setSubmitPopup(false);
    setLoading(false);
  };

  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)" }}
      className='pos-fixed top-50 left-50 translate-middle-y  w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4>هل انت متاكد من قبول  الطلب </h4>
          <img src={active.src} alt='trash' width={80} className='my-4' />
          <div className='d-flex justify-content-center gap-5'>
            <button
              className='btn btn-lg btn-success px-5 '
              onClick={verifyPurchase}
              disabled={loading}
              style={{ minWidth: "fit-content" }}
            >
              {loading ? "جاري التحميل ..." : "قبول"}
            </button>
            <button
              className='btn btn-lg btn-outline-dark px-5'
              onClick={() => setSubmitPopup(false)}
            >
              إلغاء
            </button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
const SubmitRecitePopup = ({
  setSubmitRecitePopup,
  currentRecite,
  currentReciteAmount,
  setCurrentReciteAmount,
  forceUpdate,
  token,
  user_type
}) => {
  const [loading, setLoading] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const verifyRecite = async () => {
    setLoading(true);
    const name = user_type == "ADM" ? 'admin_receipt' : 'accountant_receipt'
    const res = await fetch(
      `${baseUrl}/api/v1/${name}/${currentRecite.id}/`,
      {
        method: "PATCH",
        body: JSON.stringify({
          bank_name: currentRecite.bank_name,
          amount: +currentReciteAmount,
          purchase_type: "pick",

        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      },
    );
    if (res.status == 401) {
      logout()
    }
    const data = await res.json();
    if (res.status === 200 && data.success) {
      toast.success("تم القبول بنجاح");
      forceUpdate();
    } else {
      toast.error(data.message || data.error || data.detail || "حدث خطأ ما");
    }
    setSubmitRecitePopup(false);
    setLoading(false);
  };

  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)" }}
      className='pos-fixed top-50 left-50 translate-middle-y  w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>

          {/* {
            currentRecite.amount >0 ? 
            
           <Form.Group className='text-start form-group'>
              <Form.Label>القيمة</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل القيمة الجديدة'
                name='reason'
                type='number'
                
                onChange={(e) => setCurrentReciteAmount(e.target.value)}
                required
              />
            </Form.Group>
            :
           ''
          } */}

          <h4>هل انت متاكد من   تسجيل قيمة الايصال </h4>
          <img src={active.src} alt='trash' width={80} className='my-4' />
          <div className='d-flex justify-content-center gap-5'>
            <button
              className='btn btn-lg btn-success px-5 '
              onClick={verifyRecite}
              disabled={loading}
              style={{ minWidth: "fit-content" }}
            >
              {loading ? "جاري التحميل ..." : "قبول"}
            </button>
            <button
              className='btn btn-lg btn-outline-dark px-5'
              onClick={() => setSubmitRecitePopup(false)}
            >
              إلغاء
            </button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
const EditeRecitePopup = ({
  setEditeRecitePopup,
  currentRecite,
  setReciteData,
  reciteData
}) => {
  const [loading, setLoading] = useState(false);



  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)" }}
      className='pos-fixed top-50 left-50 translate-middle-y  w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>


          <h4>هل انت متاكد من   تعديل  قيمة الايصال </h4>
          <img src={active.src} alt='trash' width={80} className='my-4' />
          <div className='d-flex justify-content-center gap-5'>
            <button
              className='btn btn-lg btn-success px-5 '
              onClick={() => {
                console.log(currentRecite, reciteData);
                setReciteData(
                  reciteData.map((el) => {
                    el.id == currentRecite.id ? el.editable = true : null
                    return el
                  })
                )
                setEditeRecitePopup(false)
              }}
              disabled={loading}
              style={{ minWidth: "fit-content" }}
            >
              قبول
            </button>
            <button
              className='btn btn-lg btn-outline-dark px-5'
              onClick={() => setEditeRecitePopup(false)}
            >
              إلغاء
            </button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
const ShowRecitePopup = ({
  setShowRecitePopup,
  currentRecite,

}) => {


  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)", overflow: 'hidden' }}
      className='pos-fixed top-50 left-50 translate-middle-y   w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "60%", height: '60vh' }}>
        <Card.Body className='text-center ' style={{ height: "100%" }}>
          <h4>الايصال </h4>
          <div style={{ width: "100%", height: '80%', overflow: 'auto' }}>


            {

              currentRecite.file.split('.')[currentRecite.file.split('.').length - 1] == 'pdf' ?

                <iframe style={{ width: "100%", height: '100%' }} src={`${baseUrl}/${currentRecite.file}`} frameborder="0"></iframe>
                :

                <img src={`${baseUrl}/${currentRecite.file}`} alt="" />
            }
          </div>
          <div className='d-flex justify-content-center gap-5'>

            <button
              className='btn btn-lg btn-outline-dark px-5'
              onClick={() => setShowRecitePopup(false)}
            >
              إلغاء
            </button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
