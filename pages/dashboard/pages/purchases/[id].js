import React, { useEffect, useReducer, useRef, useState } from "react";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import { Button, Card, Col, Form, Modal, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import Seo from "../../../../shared/layout-components/seo/seo";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import trash from "../../../../public/assets/img/trash.png";
import active from "../../../../public/assets/img/active.png";
import receipt from "../../../../public/assets/img/receipt.svg";
import socument from "../../../../public/assets/img/socument.svg";
import card from "../../../../public/assets/img/card.svg";
import creditCardIcon from "../../../../public/assets/img/creditCard.jpeg";
import appledIcon from "../../../../public/assets/img/apple.png";
import dynamic from "next/dynamic";
const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
});
const DataTableExtensions = dynamic(
  () => import("react-data-table-component-extensions"),
  { ssr: false },
);
import { getUserCookies } from "../../../../utils/getUserCookies";
import { getFormatedTime } from "../../../../utils/getFormatedTime";
import logout from "../../../../utils/logout";
let html2pdf;
if (typeof window !== 'undefined') {
  html2pdf = require('html2pdf.js');
}

const user = getUserCookies();

const Orders = () => {
  const router = useRouter();
  const { id } = router.query;
  const [reciteData, setReciteData] = useState([]);
  const { token, id: adminId, user_type } = user;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [submitPopup, setSubmitPopup] = useState(false);
  const [submitRecitePopup, setSubmitRecitePopup] = useState(false);
  const [editeRecitePopup, setEditeRecitePopup] = useState(false);
  const [showRecitePopup, setShowRecitePopup] = useState(false);
  const [currentRecite, srtCurrentRecite] = useState();
  const [currentReciteAmount, setCurrentReciteAmount] = useState(0);
  const [specs, setSpecs] = useState([]);
  const [showAddFileModal, setShowAddFileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileNote, setFileNote] = useState('');
  const [documents, setDocuments] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [showViewFileModal, setShowViewFileModal] = useState(false);
  const [currentViewFile, setCurrentViewFile] = useState(null);
  const [rejectPopup, setRejectPopup] = useState(false);
  const [renewPopup, setRenewPopup] = useState(false);
  const [updateQuantityPopup, setUpdateQuantityPopup] = useState(false);
  const [showEditDueDatePopup, setShowEditDueDatePopup] = useState(false);
  const [payments, setPayments] = useState([]);
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [amounts, setAmounts] = useState({})
  const [isCanUpdateAndConfirmRecite, setIsCanUpdateAndConfirmRecite] = useState(false);
  const [isCanUpdate, setIsCanUpdate] = useState(false);
  const [isCanShowPurchasesFiles, setIsCanShowPurchasesFiles] = useState(false);
  const previousUrlRef = useRef(null);

  // Store the previous URL (with filters) when component mounts
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get the referrer URL (the page we came from)
    const referrer = document.referrer;

    // If referrer is the index page, store it with query params
    if (referrer && referrer.includes('/dashboard/pages/purchases')) {
      try {
        const referrerUrl = new URL(referrer);
        // Store the full URL with query parameters
        previousUrlRef.current = referrerUrl.pathname + referrerUrl.search;
      } catch (e) {
        // If URL parsing fails, try to extract from referrer string
        const match = referrer.match(/\/dashboard\/pages\/purchases[^\/]*(\?.*)?/);
        if (match) {
          previousUrlRef.current = match[0];
        }
      }
    }

    // Also try to get from sessionStorage (in case referrer is not available)
    const storedUrl = sessionStorage.getItem('purchasesIndexUrl');
    if (storedUrl) {
      previousUrlRef.current = storedUrl;
    }
  }, []);

  // Handle browser back button - use router.push with preserved filters
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (event) => {
      // When browser back is pressed, check if we need to navigate to index
      setTimeout(() => {
        const currentPath = window.location.pathname;
        const isDetailsPage = /\/dashboard\/pages\/purchases\/\d+/.test(currentPath);

        // If we're still on details page after popstate, user might have navigated forward
        // Otherwise, if we're on index page, let it initialize naturally
        if (!isDetailsPage) {
          // We're on index page now - the URL should have the query params
          // The index page will read them from the URL
          return;
        }
      }, 0);
    };

    // Also handle route change events
    const handleRouteChange = (url) => {
      // If navigating to index page, ensure we have the stored URL
      if (url === '/dashboard/pages/purchases' || url.startsWith('/dashboard/pages/purchases?')) {
        const storedUrl = sessionStorage.getItem('purchasesIndexUrl');
        if (storedUrl && storedUrl !== url) {
          // Use stored URL with filters
          router.replace(storedUrl);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);

  useEffect(() => {
    if (user_type === "ACC") {
      const permissions = JSON.parse(localStorage.getItem("permissions"))
      const componentPermissions = permissions?.filter(
        (permission) => permission.group_name === 'عمليات الشراء'
      );
      const canUpdateAndConfirmRecite = componentPermissions?.some((permission) => permission.display_name === 'تأكيد وتعديل مبلغ الإيصال');
      const canUpdate = componentPermissions?.some((permission) => permission.display_name === 'تعديل');
      const showPurchasesFiles = componentPermissions?.some((permission) => permission.display_name === "عرض مستندات الشراء");
      setIsCanUpdateAndConfirmRecite(canUpdateAndConfirmRecite);
      setIsCanShowPurchasesFiles(showPurchasesFiles);
      setIsCanUpdate(canUpdate);
    }
  }, [user]);
  //* Get Purchase Details
  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/v1/purchase-documents/?purchase=${id}&purchase_type=PURCHASE`, {
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
    if (id) {
      fetch(`${baseUrl}/api/v1/get_purchase_detail/${id}/?admin_id=` + adminId, {
        headers: { "Authorization": token }
      })
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
          setData(data[0]);
          setSpecs(data[0].purchase_package_specs);
          setPayments(data[0].payments);

          const initAmounts = {};
          setReciteData(
            data[0].Receipt.map((el) => {
              initAmounts[el.id] = el.amount;
              el.editable = el.amount > 0 ? false : true
              return el

            })
          )
          setAmounts(initAmounts)
          fetchDocuments();

        });
    }
  }, [id, update]);


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
    formData.append("purchase_type", "PURCHASE");
    formData.append("document", selectedFile);
    formData.append("note", fileNote);

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
        setFileNote('');
        fetchDocuments(); // Refresh documents list
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to upload file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("An error occurred while uploading the file");
    }
    finally {
      setLoading(false);
    }
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
  const getStatusClass = (status) => {
    switch (status) {
      case "NEW":
        return "btn-primary_";
      case "PAID":
        return "btn-success_";
      case "REJECTED":
        return " btn-danger_";
      case "SOLD":
        return " btn-info_";
      case "PENDING":
        return " btn-warning_";
      case "UPLOADED_FILE":
        return " btn-secondary_";
      case "PAID_PARTIALLY":
        return " btn-secondary_";
      case "SOLD_PARTIALLY":
        return " btn-info_"; // Example, change as needed
      case "CANCELLED":
        return " btn-dark_";
      default:
        return " btn-light_"; // Default color
    }
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

              <Button disabled={data?.status == "PAID" || data?.status == "SOLD_PARTIALLY" || data?.status == "SOLD" ? true : false}

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
      }
      :
      '',
    // {
    //   name: "الكمية",
    //   selector: (row) => [row?.quantity],
    //   sortable: true,
    //   cell: (row) => <div>{row?.quantity}</div>,
    // },


  ];
  const columnsOfPayment = [
    {
      name: "القيمة",
      selector: (row) => [row?.amount],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'>{row?.amount} </span>
        </div>
      ),

      sortable: true,
    },
    {
      name: "البطاقة",
      selector: (row) => [+row?.payment_method.card_number],
      sortable: true,
      cell: (row) => (
        <div

          className='font-weight-bold text-primary cursor-pointer '> {row?.payment_method.card_number}</div>
      ),
    },

    {
      name: "طريقة الدفع",
      selector: (row) => [row?.amount],
      cell: (row) => (
        <div className='font-weight-bold d-flex justify-content-center'>

          <span className="shadow-lg p-2">
            {
              row?.payment_method?.payment_type?.name_en == "creditcard" ?
                <img src={creditCardIcon.src} width={100} alt="credit card" />
                :
                <img src={appledIcon.src} width={70} alt="credit card" className="shadow" />



            }
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      name: " الحالة",
      selector: (row) => [row?.status],
      cell: (row) => (
        <div className=' d-flex justify-content-center'>


          {
            row?.status == "PAID" ?
              <span className="btn-success_ text-white">ناجحة</span>
              :
              <span className="btn-danger_ text-white">غير ناجحة</span>



          }

        </div>
      ),
      sortable: true,
    },
    {
      name: " التاريخ",
      selector: (row) => [row?.created_at],
      sortable: true,
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'>{getFormatedTime(row.created_at)}</span>
        </div>
      ),
      sortable: true,
    },

    // {
    //   name: "الكمية",
    //   selector: (row) => [row?.quantity],
    //   sortable: true,
    //   cell: (row) => <div>{row?.quantity}</div>,
    // },


  ];
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
      name: "الملاحظة",
      selector: (row) => row.document_name,
      cell: (row) => (
        <span


        >
          {row?.note}
        </span>
      ),
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

  const tableData = {
    columns,
    data: reciteData,
  };
  const tableDataOfPayment = {
    columns: columnsOfPayment,
    data: payments,
  };
  const documentsTableData = {
    columns: documentsColumns,
    data: documents,
  };

  const [modalContent, setModalContent] = useState('');
  const [showModal, setShowModal] = useState(false);
  const statusClass = getStatusClass(data?.status);
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

  const handleMarketingInvoice = () => {
    if (showMarketingContract) {
      fetch(`${baseUrl}/docs/create_marketing_invoice/?user_id=${data?.user_id}&purchase_id=${data?.id}`, {
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
  const handleSetSubmitPopup = () => {
    if (data?.remaining_amount > 0) {
      toast.error("   لم يتم دفع المبلغ بالكامل  ");

    }
    else {
      setSubmitPopup(true)
    }
  }
  const printDocument = () => {
    console.log(';;;;;;;;;;;;;;;;');
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
    < div style={{position: 'relative'}}>
      <Seo title='عمليات الشراء' />

      <PageHeader
        title='عمليات الشراء'
        item='شركة وحيد'
        active_item={"عملية شراء " + data?.Package?.title}
      />
      <div className='d-flex justify-content-between align-items-center mb-3' style={{position: 'absolute', top: '10px', left: '10px'}}>
        <Button
          variant="outline-secondary"
          onClick={() => {
            // Navigate back to index page with preserved filters
            const backUrl = previousUrlRef.current || '/dashboard/pages/purchases';
            router.push(backUrl);
          }}
          className="d-flex align-items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          العودة إلى قائمة الشراء
        </Button>
      </div>
      <div>
        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 pb-0'>

                <div className='d-flex justify-content-between'>
                  <div className='d-flex justify-content-between'>
                    <label className='main-content-label my-auto pt-2'>
                      <span> شراء من :  </span>

                      <span className="mr-2">
                        <Link
                          href={`/dashboard/pages/packages/${data?.Package?.id}/`}
                        >
                          {data?.Package?.title}
                        </Link>
                      </span>
                    </label>
                  </div>
                  <div className="d-flex flex-wrap gap-2 ">
                    {
                      user_type === "ADM" || isCanUpdate ?
                        <>

                          <Button
                            className='mx-3'
                            onClick={() => setUpdateQuantityPopup(true)}
                          >
                            تعديل الكمية
                          </Button>
                          {user_type === "ADM" && (
                            <Button
                              className='mx-3'
                              onClick={() => setShowEditDueDatePopup(true)}
                            >
                              تعديل تاريخ الاستحقاق
                            </Button>
                          )}
                          <Button
                            className='mx-3'
                            onClick={() => setShowAddFileModal(true)}
                          >
                            إرفاق مستند
                          </Button>
                          {
                            data?.status !== "CANCELLED" ?

                              <Button onClick={() => setRejectPopup(true)}>
                                الغاء الشراء
                              </Button>
                              :



                              <Button onClick={() => setRenewPopup(true)}>
                                إعادة  الشراء
                              </Button>
                          }
                        </>
                        :
                        ''

                    }
                  </div>
                </div>
              </Card.Header>
              <Card.Body className=' d-flex gap-3 justify-content-between'>
                <div className=' d-flex flex-1 flex-column gap-3'>
                  {/* <label className="app-label">{"عملية شراء: " + data?.Package?.title}</label> */}
                  <label className='app-label'>رقم تسلسلي: {data?.id}</label>
                  <Link
                    className='app-label'
                    href={"/dashboard/pages/users/" + data?.user_id + "/"}
                  >
                    {data?.user?.name} - <span dir="ltr"><span><img className="" src={`${baseUrl}/${data?.user?.country_code?.flag_image}`} alt="" style={{ width: '30px' }} /></span> {data?.user?.country_code?.code}{' '} {data?.user?.mobile}</span>
                  </Link>
                  <label className='app-label'> الكمية: {data?.quantity}</label>
                  <label className='app-label'> التقييم: {data?.rating}</label>
                  <label className='app-label'>
                    {" "}
                    السعر: {data?.total_price?.toFixed(3).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </label>
                  {/* <label className="app-label"> الربح: {data?.profit}</label> */}
                  {/* <label className="app-label"> نقاط البيع: {data?.sale_pointer}</label> */}
                  {/* <label className="app-label"> نسبة الضريبة: {data?.vat_percentage}</label> */}
                  <label className='app-label'>
                    {" "}
                    الحالة:{" "}
                    <button className={statusClass}>
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
                                    : data?.status === "CANCELLED"
                                      ? "ملغية"
                                      : data?.status === "PAID_PARTIALLY"
                                        ? "مدفوع جزئيا"
                                        : data?.status === "PAYMENT_INITIATED"
                                          ? " تمت محاولة الدفع"
                                          : data?.status}
                    </button>
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
                      {/* <iframe src={'/'+data?.Receipt?.file} frameborder="0" height="500"></iframe> */}
                    </>
                  )}
                  <label className='app-label'>
                    {" "}
                    تاريخ الإنشاء: {data?.datetime}
                  </label>

                </div>
                {/* <div className=' d-flex flex-1 flex-column gap-3'>
                  <label className="app-label">{"البلد: " + data?.country}</label>
                  <label className="app-label">لمنطقة: {data?.region}</label>
                  <label className="app-label"> المدينة: {data?.city}</label>
                  <label className="app-label"> الشارع: {data?.street}</label>
                  <label className="app-label"> الرمز البريدي: {data?.postal_code}</label>
                </div> */}
              </Card.Body>
              <Card.Header className=' border-bottom-0 pb-0'>
                <h3 style={{ color: "var(--primary-bg-color)" }}>عمليات الدفع</h3>
              </Card.Header>
              <Card.Body>
                <DataTableExtensions {...tableDataOfPayment}>
                  <DataTable
                    columns={columnsOfPayment}
                    defaultSortAsc={false}
                  // striped={true}

                  />
                </DataTableExtensions>
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
                        specs.map((spec) => (
                          <Card
                            className='d-flex flex-1 flex-column gap-3 p-3 my-2 mx-2'
                            style={{ minWidth: "280px" }}
                            key={spec?.id}
                          >


                            <label style={{ lineHeight: "1.7" }} s>
                              {" "}
                              <span className='font-weight-bold '>الكمية:</span>{" "}
                              {spec?.quantity}
                            </label>
                            <label style={{ lineHeight: "1.7" }} s>
                              {" "}
                              <span className='font-weight-bold '>تم البيع:</span>{" "}
                              {spec?.sold}
                            </label>

                            {/* <label style={{ lineHeight: "1.7" }} s>
                        {" "}
                        <span className="font-weight-bold ">الربح:</span> {spec?.profit}
                      </label> */}
                            <label style={{ lineHeight: "1.7" }} s>
                              {" "}
                              <span className='font-weight-bold '>المتبقي للعميل:</span>{" "}
                              {spec?.quantity - spec?.sold}
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
              <Card.Header className=' border-bottom-0 pb-0'>
                <h3 style={{ color: "var(--primary-bg-color)" }}>اللإيصالات</h3>
              </Card.Header>
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

                      </Button>
                      :
                      ''



                  )}
                {/* <button
                  className=' btn-lg btn-danger px-5 py-2'
                  onClick={() => setRejectPopup(true)}
                >
                  رفض
                </button> */}

              </div>
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
                  <Form.Group className="mt-4">
                    <Form.Label> ملاحظة</Form.Label>
                    <Form.Control
                      type="text"
                      value={fileNote}
                      onChange={(e) => setFileNote(e.target.value)}
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
                          className="mx-auto d-block "
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
                user_type === "ADM" || isCanShowPurchasesFiles || user_type === "SALE" ?

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
                          <Card className='d-flex  flex-column gap-3 p-3 my-2 mx-2'>
                            <div style={{ cursor: "pointer" }} onClick={() => handlePurchaseRecipte('create_contract')} className="d-flex gap-5 align-items-center justify-content-center">
                              <span>
                                <img width={80} src={socument.src} alt="" />
                              </span>
                              <span>
                                عقد الشراء
                              </span>

                            </div>
                          </Card>
                          <Card className='d-flex  flex-column gap-3 p-3 my-2 mx-2'>
                            <div style={{ cursor: "pointer" }} onClick={() => handlePurchaseRecipte('create_catch')} className="d-flex gap-5 align-items-center justify-content-center">
                              <span>
                                <img width={80} src={card.src} alt="" />
                              </span>
                              <span>
                                سند الاستلام
                              </span>

                            </div>
                          </Card>
                          <Card className='d-flex  flex-column gap-3 p-3 my-2 mx-2'>
                            <div style={{ cursor: "pointer" }} onClick={() => handleMarketingInvoice()} className="d-flex gap-5 align-items-center justify-content-center">
                              <span>
                                <img width={80} src={receipt.src} alt="" />
                              </span>
                              <span>
                                فاتورة التسويق
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

            </Card>
          </Col>
        </Row>

        {rejectPopup && (
          <RejectPopup
            setRejectPopup={setRejectPopup}
            token={token}
            id={id}
            adminId={adminId}
            quantity={data?.quantity}
            forceUpdate={forceUpdate}
          />
        )}
        {renewPopup && (
          <RenewPopup
            setRenewPopup={setRenewPopup}
            token={token}
            id={id}
            adminId={adminId}
            forceUpdate={forceUpdate}
          />
        )}
        {updateQuantityPopup && (
          <UpdateQuantityPopup
            setUpdateQuantityPopup={setUpdateQuantityPopup}
            token={token}
            id={id}
            adminId={adminId}
            forceUpdate={forceUpdate}
            q={data?.quantity}
          />
        )}
        {showEditDueDatePopup && (
          <EditDueDatePopup
            setShowEditDueDatePopup={setShowEditDueDatePopup}
            token={token}
            purchaseId={id}
            data={data}
            currentDueDate={data?.due_date || data?.date}
            forceUpdate={forceUpdate}
          />
        )}
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
    </div>
  );
};

Orders.layout = "Contentlayout";

export default Orders;

const RejectPopup = ({
  setRejectPopup,
  token,
  id,
  adminId,
  quantity,
  forceUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [file, setFile] = useState(null);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const rejectPurchase = async () => {
    setLoading(true);
    const fd = new FormData();
    fd.append("notes", note);
    fd.append("status", "CANCELLED");
    if (file) {
      fd.append("cancellation_reason_file", file);
    }
    const res = await fetch(
      `${baseUrl}/api/v1/sale_employee/update_purchase_quantity/${id}/?employee_id=${adminId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `${token}`,
        },
        body: fd,
      },
    );
    if (res.status == 401) {
      logout()
    }
    const result = await res.json();
    console.log(result, 'llllllllll');

    if (result.data?.status === "CANCELLED") {
      toast.success("تم الغاء الطلب بنجاح");
      setRejectPopup(false);
      forceUpdate();
    } else {
      toast.error(result.message || result.error || result.detail || "حدث خطأ ما حاول مرة أخرى");
    }
    setLoading(false);
  };

  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)" }}
      className='pos-fixed top-50 left-50 translate-middle-y  w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4>هل انت متاكد من رفض طلب الشراء </h4>
          <img src={trash.src} alt='trash' width={80} className='my-4' />
          <Form>
            <Form.Group className='text-start form-group'>
              <Form.Label>السبب/الملاحظات</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل سبب الرفض او الملاحظات'
                name='reason'
                type='text'
                value={note}
                onChange={(e) => setNote(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='text-start form-group mt-3'>
              <Form.Label>ملف سبب الإلغاء</Form.Label>
              <Form.Control
                className='form-control'
                type='file'
                name='cancellation_reason_file'
                onChange={(e) => setFile(e.target.files[0])}
                accept='image/*,application/pdf'
                required
              />
            </Form.Group>
          </Form>
          <div className='d-flex justify-content-center gap-5'>
            <Button
              variant='danger'
              disabled={loading}
              onClick={rejectPurchase}
            >
              {loading ? "جاري الالغاء ..." : "الغاء عملية الشراء"}
            </Button>
            <Button
              variant='outline-light text-dark'
              onClick={() => setRejectPopup(false)}
              className="btn-outline-dark"
            >
              اغلاق
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
const RenewPopup = ({
  setRenewPopup,
  token,
  id,
  adminId,
  forceUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const renewPurchase = async () => {
    setLoading(true);
    const fd = new FormData();
    fd.append("purchase_id ", id);
    const res = await fetch(
      `${baseUrl}/api/v1/renew-purchase/`,
      {
        method: "POST",
        headers: {
          Authorization: `${token}`,
        },
        body: fd,
      },
    );
    if (res.status == 401) {
      logout()
    }
    const result = await res.json();
    console.log(result, 'ooooooooooooooooo');

    if (result.success) {
      toast.success("تم إعادة  الشراء بنجاح");
      setRenewPopup(false);
      forceUpdate();
    } else {
      toast.error(result.message || result.error || result.detail || "حدث خطأ ما حاول مرة أخرى");
    }
    setLoading(false);
  };

  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)" }}
      className='pos-fixed top-50 left-50 translate-middle-y  w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4>هل انت متاكد من إعادة  طلب الشراء </h4>

          <div className='d-flex justify-content-center gap-5 mt-4'>
            <Button
              variant='success'
              disabled={loading}
              onClick={renewPurchase}
            >
              {loading ? "جاري الطلب ..." : "إعادة    الشراء"}
            </Button>
            <Button
              variant='outline-light text-dark'
              onClick={() => setRenewPopup(false)}
              className="btn-outline-dark"
            >
              اغلاق
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

const UpdateQuantityPopup = ({
  setUpdateQuantityPopup,
  token,
  id,
  adminId,
  forceUpdate,
  q,
}) => {
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(q);
  const [note, setNote] = useState("");
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const updateQuantity = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    fd.append("quantity", quantity);
    fd.append("notes", note);

    const res = await fetch(
      `${baseUrl}/api/v1/sale_employee/update_purchase_quantity/${id}/?employee_id=${adminId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `${token}`,
        },
        body: fd,
      },
    );
    if (res.status == 401) {
      logout()
    }
    const result = await res.json();
    if (res.status === 200 || res.ok) {
      toast.success("تم  تعديل الكمية بنجاح");
      setUpdateQuantityPopup(false);
      forceUpdate();
    } else {
      toast.error(result.message || result.error || result.detail || "حدث خطأ ما حاول مرة أخرى");
    }
    setLoading(false);
  };

  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)" }}
      className='pos-fixed top-50 left-50 translate-middle-y  w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4>هل انت متاكد من تعديل الكمية </h4>

          <Form onSubmit={(e) => updateQuantity(e)}>
            <Form.Group className='text-start form-group'>
              <Form.Label>الكمية</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل الكمية الجديدة'
                name='reason'
                type='number'
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className='text-start form-group'>
              <Form.Label>الملاحظات</Form.Label>
              <Form.Control
                className='form-control'
                placeholder=' الملاحظات'
                name='reason'
                type='text'
                value={note}
                onChange={(e) => setNote(e.target.value)}
                required
              />
            </Form.Group>

            <div className='d-flex justify-content-center gap-5'>
              <button
                className='btn btn-lg btn-danger px-5 '
                onClick={() => { }}
                disabled={loading}
                style={{ minWidth: "fit-content" }}
                type='submit'
              >
                {loading ? "جاري التعديل ..." : "تعديل"}
              </button>
              <button
                className='btn btn-lg btn-outline-dark px-5'
                type='button'
                onClick={() => setUpdateQuantityPopup(false)}
              >
                إلغاء
              </button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

const EditDueDatePopup = ({
  setShowEditDueDatePopup,
  token,
  purchaseId,
  data,
  forceUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [dateValue, setDateValue] = useState("");
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    if (data?.deserve_sale_date) {
      try {
        // Try to parse strings like "12:00PM 2026-03-01"
        const dateStr = data.deserve_sale_date.trim();
        // Try parse using Date first
        let d = new Date(dateStr);
        // If it results in an invalid date, handle manually
        if (isNaN(d.getTime())) {
          // Try to extract using regex: time part and date part
          // Ex: "12:00PM 2026-03-01"
          const match = dateStr.match(/^(\d{1,2}:\d{2}(?:AM|PM))\s+(\d{4}-\d{2}-\d{2})$/i);
          if (match) {
            let [_, time, date] = match;
            // Convert "12:00PM" to 24hr
            let [hhmm, period] = [time.slice(0, -2), time.slice(-2)];
            let [hours, minutes] = hhmm.split(':').map(Number);
            if (/PM/i.test(period) && hours < 12) hours += 12;
            if (/AM/i.test(period) && hours === 12) hours = 0;
            d = new Date(`${date}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
          }
        }
        if (!isNaN(d.getTime())) {
          // Adjust for local timezone
          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
          setDateValue(local.toISOString().slice(0, 16));
        }
      } catch (e) {}
    } else {
      const now = new Date();
      const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
      setDateValue(local.toISOString().slice(0, 16));
    }
  }, [data?.deserve_sale_date]);

  const updateDueDate = async (e) => {
    e.preventDefault();
    if (!dateValue) {
      toast.error("يرجى اختيار تاريخ الاستحقاق");
      return;
    }
    setLoading(true);
    try {
      const dateIso = new Date(dateValue).toISOString();
      const res = await fetch(
        `${baseUrl}/api/v1/get_admin_purchase_detail/${purchaseId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          body: JSON.stringify({ date: dateIso }),
        }
      );
      if (res.status === 401) {
        logout();
        return;
      }
      const result = await res.json();
      if (res.ok && result.success) {
        toast.success(result.message || "تم تحديث تاريخ الاستحقاق بنجاح");
        setShowEditDueDatePopup(false);
        forceUpdate();
      } else {
        toast.error(result.message || result.error || result.detail || "حدث خطأ، حاول مرة أخرى");
      }
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء التحديث");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)" }}
      className="pos-fixed top-50 left-50 translate-middle-y  w-100 min-vh-100 d-flex justify-content-center align-items-center"
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className="text-center">
          <h4>تعديل تاريخ الاستحقاق</h4>
          <Form onSubmit={updateDueDate} className="text-start mt-4">
            <Form.Group className="form-group">
              <Form.Label>تاريخ الاستحقاق</Form.Label>
              <Form.Control
                className="form-control"
                type="datetime-local"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                required
              />
            </Form.Group>
            <div className="d-flex justify-content-center gap-3 mt-4">
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
                style={{ minWidth: "fit-content" }}
              >
                {loading ? "جاري الحفظ ..." : "حفظ"}
              </Button>
              <Button
                variant="outline-secondary"
                type="button"
                onClick={() => setShowEditDueDatePopup(false)}
              >
                إلغاء
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

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
          purchase_type: "hire",
          // purchase_type: "pick",
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
          <h4>هل انت متاكد من قبول طلب الشراء </h4>
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
          purchase_type: "hire",

        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      },
    );
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
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowRecitePopup(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    // Cleanup the event listener
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [setShowRecitePopup]);

  // Close modal on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const modalContent = document.querySelector(".modal-content_");
      if (modalContent && !modalContent.contains(event.target)) {
        setShowRecitePopup(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);

    // Cleanup the event listener
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setShowRecitePopup]);
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dark semi-transparent background
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1050, // Ensure it's above other content
      }}
      className='pos-fixed top-50 left-50 translate-middle-y    min-vh-100 d-flex justify-content-center align-items-center'
    >
      <div className="d-flex align-items-center justify-content-center" style={{ width: "80%", height: '90vh', position: 'relative' }}>
        <Card.Body className='text-center ' style={{ height: "100%" }}>

          <div className="d-flex  align-items-center justify-content-center" style={{ width: "100%", minWidth: '300px', height: '100%', overflow: 'auto', marginTop: 'auto' }}>


            {

              currentRecite.file.split('.')[currentRecite.file.split('.').length - 1] == 'pdf' ?

                <iframe className="modal-content_" style={{ width: "100%", height: '100%' }} src={`${baseUrl}/${currentRecite.file}`} frameborder="0"></iframe>
                :

                <img className="modal-content_" src={`${baseUrl}/${currentRecite.file}`} alt="" style={{ maxWidth: '100%', width: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            }
          </div>


          <button
            style={{ position: 'absolute', top: '-22px', left: '50%', fontSize: '32px' }}
            className='btn btn-lg text-danger  '
            onClick={() => setShowRecitePopup(false)}
          >
            <OverlayTrigger

              overlay={<Tooltip>  إلغاء</Tooltip>}
            >
              <i className='ti ti-close btn text-white'></i>
            </OverlayTrigger>
          </button>

        </Card.Body>
      </div>
    </div>
  );
};
