import React, { useEffect, useReducer, useState } from "react";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import { Button, Card, Col, Form, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import Seo from "../../../../shared/layout-components/seo/seo";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import trash from "../../../../public/assets/img/trash.png";
import active from "../../../../public/assets/img/active.png";
import { getUserCookies } from "../../../../utils/getUserCookies";
import dynamic from "next/dynamic";
import { getFormatedTime } from "../../../../utils/getFormatedTime";
import logout from "../../../../utils/logout";
const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
});
const DataTableExtensions = dynamic(
  () => import("react-data-table-component-extensions"),
  { ssr: false },
);
const user = getUserCookies();

const Orders = () => {
  const router = useRouter();
  const id = router.query.id;

  const { token, id: adminId, user_type } = user;

  const [data, setData] = useState({});
  const [salesData, setSalesData] = useState([]);

  const [specs, setSpecs] = useState([]);

  const [editQuantityPopup, setEditQuantityPopup] = useState(false);
  const [oldQuantity, setOldQuantity] = useState(0);
  const [sellingSetupPopup, setSellingSetupPopup] = useState(false);
  const [submitPopup, setSubmitPopup] = useState(false);
  const [rejectPopup, setRejectPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [confirmData, setConfirmData] = useState({});
  const [confirmPopup, setConfirmPopup] = useState(false);
  const [file, setFile] = useState(null);
  const [vat, setVat] = useState(0.0);

  const [otp, setOtp] = useState(null);
  const [otpPopup, setOtpPopup] = useState(false);
  const [sendingData, setSendingData] = useState({});
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [isCanShowSelling, setIsCanShowSelling] = useState(false);
  const [isCanShowPurchases, setIsCanShowPurchases] = useState(false);
  const [isCanUpdate, setIsCanUpdate] = useState(false);
  const [isCanAddPurchase, setIsCanAddPurchase] = useState(false);
  useEffect(() => {
    if (user_type === "ACC") {
      const permissions = JSON.parse(localStorage.getItem("permissions"))
      const componentPermissions = permissions?.filter(
        (permission) => permission.group_name === 'الباقات'
      );
      const purchasesPermissions = permissions?.filter(
        (permission) => permission.group_name === 'عمليات الشراء'
      );
      const sellingPermissions = permissions?.filter(
        (permission) => permission.group_name === 'عمليات البيع'
      );
      const canShowPurchases = purchasesPermissions?.some((permission) => permission.display_name === 'عرض');
      const canShowSelling = sellingPermissions?.some((permission) => permission.display_name === 'عرض');
      const canAdd = componentPermissions?.some((permission) => permission.display_name === 'اضافة');
      const canUpdate = componentPermissions?.some((permission) => permission.display_name === 'تعديل');
      const canAddPurchase = componentPermissions?.some((permission) => permission.display_name === "تسجيل بيع");

      setIsCanUpdate(canUpdate);
      setIsCanAddPurchase(canAddPurchase);
      setIsCanShowPurchases(canShowPurchases);
      setIsCanShowSelling(canShowSelling);
    }
  }, [user]);
  // * Get vat percentage
  useEffect(() => {
    fetch(`${baseUrl}/api/v1/company-info/`, {
      headers: {

        Authorization: token,
      },
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
      .then((data) => setVat(+data?.data?.info?.vat_percentage));
  }, []);

  const [update, forceUpdate] = useReducer((x) => x + 1, 0);

  //* Get Package Details
  useEffect(() => {
    fetch(`${baseUrl}/api/v1/package_search/${id}/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    })
      .then((res) => res.json())
      .then((data) => {

        data && setData(data);
        data && (
          user_type === "ADM" || isCanShowSelling ?

            setSalesData(data?.sales) : ''
        )
        setOldQuantity(data.quantity)
      });
  }, [id, update, editQuantityPopup]);

  //* Get Recent Purchases
  useEffect(() => {
    user_type === "ADM" || isCanShowPurchases ? fetch(`${baseUrl}/api/v1/get_recent_purchases/?package_id=${id}`, {
      headers: {

        Authorization: token,
      },
    })
      .then((res) => res.json())
      .then((data) => setRecentPurchases(data)) : ''
  }, [id, update, isCanShowPurchases]);

  //* Get Package Specs
  useEffect(() => {
    fetch(`${baseUrl}/api/v1/get_package_specs/?package_id=${id}`, {
      headers: {

        Authorization: token,
      },
    })
      .then((res) => res.json())
      .then((data) => setSpecs(data));
  }, [id, update]);

  //* Setup selling
  const setupSelling = async (e, data) => {
    e.preventDefault();

    const { files, price, tax, fee, quantity, uniqueSpecs } = data;

    const fd = new FormData();
    for (let i = 1; i <= files.length; i++) {
      fd.append(`file`, files[i - 1]);
      setFile(files[0]);
    }

    fd.append("package", id);
    fd.append("total_amount", price);
    fd.append("vat_amount", tax);
    fd.append("commission", fee);
    fd.append("quantity", quantity);
    fd.append("package", id);
    fd.append("starting_range", 1);
    fd.append("specs", JSON.stringify(uniqueSpecs));


    setLoading(true);

    const res = await fetch(`${baseUrl}/api/v1/preview_sale/`, {
      method: "POST",
      body: fd,
      headers: {
        Authorization: token,
      },
    });
    if (res.status == 401) {
      logout()
    }
    const result = await res.json();

    // console.log(result["preview_sale"]["id"]);



    if (res.status === 201) {
      const previewResult = result;
      if (res.ok) {
        setLoading(false);
        setConfirmData({ ...previewResult, ...data });
        setConfirmPopup(true);

      } else {
        setLoading(false);
        toast.error(result.message || "حدث خطأ ما");
      }
      setLoading(false);
    } else {
      setLoading(false);
      return toast.error(result.error);
    }

    setLoading(false);
    setSellingSetupPopup(false);
    e.target.reset();
  };


  //* Sale Setup 2
  const sale = async () => {
    const { price, tax, fee, quantity } = confirmData;

    setLoading(true);

    const fd = new FormData();
    fd.append(`file`, file);
    fd.append("package", id);
    fd.append("total_amount", price);
    fd.append("vat_amount", tax);
    fd.append("commission", fee);
    fd.append("quantity", quantity + 1);
    fd.append("package", id);
    fd.append("starting_range", 1);
    fd.append("preview_id", confirmData?.data?.preview_sale?.id);
    // fd.append("otp", otp);
    const res2 = await fetch(
      ` ${baseUrl}/api/v1/admin_sale/?preview_id=${confirmData?.data?.preview_sale?.id}&admin_id=${adminId}`,

      {
        method: "POST",
        body: fd,
        headers: {
          Authorization: token,
        },
      },
    );
    const result2 = await res2.json();
    if (res2.status === 201 || res2.status === 200 || res2.ok) {
      setOtpPopup(true);
    } else {
      toast.error(result2.message || result2.error || result2.detail || "حدث خطأ أثناء التسجيل");
      setLoading(false);
    }
    setLoading(false);
    setConfirmPopup(false);
  };

  //* Sale Setup 3 OTP
  const saleOtp = async () => {
    const { price, tax, fee, quantity } = confirmData;

    setLoading(true);

    const fd = new FormData();
    fd.append(`file`, file);
    fd.append("package", id);
    fd.append("total_amount", price);
    fd.append("vat_amount", tax);
    fd.append("commission", fee);
    fd.append("quantity", quantity + 1);
    fd.append("package", id);
    fd.append("starting_range", 1);
    fd.append("preview_id", confirmData?.data?.preview_sale?.id);
    fd.append("otp", otp);
    const res2 = await fetch(
      ` ${baseUrl}/api/v1/admin_sale/?preview_id=${confirmData?.data?.preview_sale?.id}&admin_id=${adminId}`,

      {
        method: "POST",
        body: fd,
        headers: {
          Authorization: token,
        },
      },
    );
    const result2 = await res2.json();
    if (res2.status === 201 || res2.status === 200 || res2.ok) {
      toast.success(result2.message || "تم التسجيل بنجاح");
      setOtpPopup(false);
    } else {
      toast.error(result2.message || result2.error || result2.detail || "حدث خطأ أثناء التسجيل");
      setLoading(false);
    }
    setLoading(false);
    setConfirmPopup(false);
  };

  async function hidePackage() {
    setLoading(true);
    const res = await fetch(
      `${baseUrl}/api/v1/hide_package/${id}/?admin_id=${adminId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: token,
        },
      },
    );
    const result = await res.json();
    if (res.status === 200 || res.ok) {
      toast.success(result.message || "تم اخفاء الباقة بنجاح");
    } else {


      toast.error(result.message || result.error || result.detail || "حدث خطأ ما");
    }
    setLoading(false);
    forceUpdate()
  }
  async function showPackage() {
    setLoading(true);
    const res = await fetch(
      `${baseUrl}/api/v1/show_package/${id}/?admin_id=${adminId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: token,
        },
      },
    );
    const result = await res.json();
    if (res.status === 200 || res.ok) {
      toast.success(result.message || "تم اظهار الباقة بنجاح");
    } else {
      toast.error("حدث خطأ ما");
    }
    setLoading(false);
    forceUpdate()
  }
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
      case "PAYMENT_INITIATED":
        return " btn-dark_";
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
  const columns = [
    {
      name: "ID",
      selector: (row) => [+row?.id],
      sortable: true,
      cell: (row) => (



        <Link className='font-weight-bold d-flex align-items-center gap-2'
          href={`/dashboard/pages/purchases/${row?.id}/`}
        >
          <span>{row?.id}</span>
        </Link>

      ),
    },

    {
      name: "تاريخ البيع",
      selector: (row) => [row?.created_at],
      sortable: true,
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'>{getFormatedTime(row?.created_at)}</span>
        </div>
      ),
      sortable: true,
    },
    {
      name: "عرض",
      selector: (row) => [row?.user?.name],
      sortable: true,
      cell: (row) => (
        <Link className='font-weight-bold'
          href={`/dashboard/pages/packages/sale/${row?.id}/`}
        >
          <OverlayTrigger
            placement={row?.Placement}
            overlay={<Tooltip>عرض التفاصيل</Tooltip>}
          >
            <i className={`ti ti-eye btn`} style={{ color: "purple", fontSize: 20, position: "relative", right: -8 }}></i>
          </OverlayTrigger>
        </Link>
      ),
    },


  ];

  const tableData = {
    columns,
    data: salesData,
  };


  return (
    <>
      <Seo title='الباقات' />

      <PageHeader title='الباقات' item='شركة وحيد' active_item={data?.title} />

      <div>
        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 pb-0'>
                <div>
                  <div className='d-flex justify-content-between'>
                    <label className='main-content-label my-auto pt-2'>
                      {data?.title}
                    </label>
                    {data?.id && (
                      <div className='actions d-flex flex-wrap gap-2'>
                        {
                          user_type === "ADM" || isCanUpdate ?

                            <Button className='mx-3' onClick={() => setEditQuantityPopup(true)}>
                              تعديل  الباقة
                            </Button>
                            : ''
                        }
                        {
                          user_type === "ADM" || isCanAddPurchase ?


                            <Button onClick={() => setSellingSetupPopup(true)}>
                              تسجيل بيع
                            </Button>
                            : ''
                        }



                        {
                          user_type === "ADM" || isCanUpdate ?
                            (

                              !data?.is_hidden ?
                                <Button
                                  className='mx-3'
                                  onClick={hidePackage}
                                  disabled={loading}
                                >
                                  {loading ? "جاري اخفاء الباقة ..." : "اخفاء الباقة"}
                                </Button>
                                :
                                <Button
                                  className='mx-3'
                                  onClick={showPackage}
                                  disabled={loading}
                                >
                                  {loading ? "جاري اظهار الباقة ..." : "اظهار الباقة"}
                                </Button>

                            )

                            : ''

                        }

                        {/* <Button
                        className='ms-2'
                        onClick={() => setAddSpecsPopup(true)}
                      >
                        إضافة محتوى جديد
                      </Button> */}
                      </div>
                    )}
                  </div>
                </div>
              </Card.Header>
              {console.log('klkhlhlhlhl', data)}
              {

                data ?

                  <div className='p-4'>
                    <div className=' d-flex flex-column gap-3'>
                      <label className='app-label'> {data?.title} <span className={'text-danger'}>{data?.is_hidden ? 'مخفية' : ""}</span></label>
                      <div className=" row  w-100">
                        <div className="d-flex flex-column gap-3 col-md-6">

                          <img

                            src={data?.image_file}
                            alt='package photo'
                            style={{ maxHeight: 200, objectFit: "contain", boxShadow: ' 2px 2px 8px #0003', borderRadius: '10px' }}
                          />
                          <div className="d-flex flex-column gap-4 w-100 justify-content-start text-center" style={{ boxShadow: ' 2px 2px 8px #0003', borderRadius: '10px' }}>

                            <label className='app-label text-primary font-weight-bold'>{data.title} رقم : {data?.id}</label>
                            <label className='app-label'>
                              <span style={{ display: 'inline-block', width: '75%' }} >

                                عدد الباقات المتاحة
                              </span>
                              <span className="text-primary font-weight-bold " style={{ display: 'inline-block', width: '25%' }}>

                                {data?.quantity}
                              </span>


                            </label>
                            <label className='app-label'>
                              <span style={{ display: 'inline-block', width: '75%' }} >

                                سعر الباقة شامل الضريبة
                              </span>
                              <span className="text-primary font-weight-bold " style={{ display: 'inline-block', width: '25%' }} >
                                {Number(data?.price).toLocaleString("en-US", {
                                  maximumFractionDigits: 3,
                                  minimumFractionDigits: 2,
                                })}
                                ريال
                              </span>
                            </label>

                            <label className='app-label'>
                              <span style={{ display: 'inline-block', width: '75%' }} >
                                نسبة الربح الكلي
                              </span>
                              <span style={{ display: 'inline-block', width: '25%' }} className="text-primary font-weight-bold  ">
                                %{data?.profit}

                              </span>

                            </label>
                            <label className='app-label'>
                              <span style={{ display: 'inline-block', width: '75%' }} >


                                نسبة   عمولة التسويق
                              </span>
                              <span style={{ display: 'inline-block', width: '25%' }} className="text-primary font-weight-bold ">

                                {data?.commission}%
                              </span>

                            </label>
                            <label className='app-label'>
                              <span style={{ display: 'inline-block', width: '75%' }} >

                                تم بيع
                              </span>
                              <span style={{ display: 'inline-block', width: '25%' }} className="text-primary font-weight-bold ">

                                {data?.sale_pointer}
                                <span className="text-primary font-weight-normal ms-4">باقة</span>
                              </span>

                            </label>
                            {/* <label className="app-label"> الحالة: {data?.status}</label> */}


                            <p style={{ width: "100%", minWidth: "300px", fontSize: 18 }}>
                              <span style={{ display: 'inline-block', width: '75%' }} className="text-start">

                                الوصف
                              </span>

                              <br />
                              {data?.shortdescription}
                            </p>
                          </div>
                        </div>
                        <div className="d-flex flex-column gap-3 col-md-6">
                          <label className='app-label'>
                            {" "}
                            تاريخ الإنشاء:{" "}
                            {new Date(data?.datetime).toLocaleDateString()}
                          </label>
                          <div className="" style={{ boxShadow: ' 2px 2px 8px #0003', borderRadius: '10px', padding: ' 30px 15px' }}>
                            <span className="font-weight-bold" style={{ display: 'inline-block', width: '75%' }} >

                              سعر  بيع الباقة شامل الضريبة
                            </span>
                            <span style={{ display: 'inline-block', width: '25%' }} className="text-primary font-weight-bold ">

                              {Number(data?.selling_price_with_vat).toLocaleString("en-US", {
                                maximumFractionDigits: 3,
                                minimumFractionDigits: 2,
                              })}
                              <span className="text-primary font-weight-normal ms-4">ريال</span>
                            </span>

                          </div>
                          <div className="" style={{ boxShadow: ' 2px 2px 8px #0003', borderRadius: '10px', padding: ' 30px 15px' }}>
                            <span className="font-weight-bold" style={{ display: 'inline-block', width: '75%' }} >

                              فائدة الباقة
                            </span>
                            <span style={{ display: 'inline-block', width: '25%' }} className="text-primary font-weight-bold ">

                              {Number(data?.return_amount).toLocaleString("en-US", {
                                maximumFractionDigits: 3,
                                minimumFractionDigits: 2,
                              })}
                              <span className="text-primary font-weight-normal ms-4">ريال</span>
                            </span>
                          </div>
                          <div className="" style={{ boxShadow: ' 2px 2px 8px #0003', borderRadius: '10px', padding: ' 30px 15px' }}>
                            <span className="font-weight-bold" style={{ display: 'inline-block', width: '75%' }} >

                              عمولة التسويق شاملة الضريبة
                            </span>
                            <span style={{ display: 'inline-block', width: '25%' }} className="text-primary font-weight-bold ">

                              {Number(data?.marketing_commission_with_vat).toLocaleString("en-US", {
                                maximumFractionDigits: 3,
                                minimumFractionDigits: 2,
                              })}
                              <span className="text-primary font-weight-normal ms-4">ريال</span>
                            </span>
                          </div>
                          <div className="" style={{ boxShadow: ' 2px 2px 8px #0003', borderRadius: '10px', padding: ' 30px 15px' }}>
                            <span className="font-weight-bold" style={{ display: 'inline-block', width: '75%' }} >

                              إجمالي رأس المال مع الفائدة بعد خصم الضريبة والعمولة
                            </span>
                            <span style={{ display: 'inline-block', width: '25%' }} className="text-primary font-weight-bold ">

                              {Number(data?.total_capital).toLocaleString("en-US", {
                                maximumFractionDigits: 3,
                                minimumFractionDigits: 2,
                              })}
                              <span className="text-primary font-weight-normal ms-4">ريال</span>
                            </span>
                          </div>
                          <div className="" style={{ boxShadow: ' 2px 2px 8px #0003', borderRadius: '10px', padding: ' 30px 15px' }}>
                            <span className="font-weight-bold" style={{ display: 'inline-block', width: '75%' }} >

                              صافي ربح العميل                            </span>
                            <span style={{ display: 'inline-block', width: '25%' }} className="text-primary font-weight-bold ">

                              {Number(data?.customer_net_profit).toLocaleString("en-US", {
                                maximumFractionDigits: 3,
                                minimumFractionDigits: 2,
                              })}
                              <span className="text-primary font-weight-normal ms-4">ريال</span>
                            </span>
                          </div>
                          <div className="" style={{ boxShadow: ' 2px 2px 8px #0003', borderRadius: '10px', padding: ' 30px 15px' }}>
                            <span className="font-weight-bold" style={{ display: 'inline-block', width: '75%' }} >

                              نسبة ربح العميل الصافي                            </span>
                            <span style={{ display: 'inline-block', width: '25%' }} className="text-primary font-weight-bold ">

                              <span className="text-primary font-weight-normal ms-4">%</span>
                              {Number(data?.customer_net_profit_percentage).toLocaleString("en-US", {
                                maximumFractionDigits: 3,
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>


                        </div>

                      </div>
                    </div>
                  </div>
                  : ''
              }
            </Card>
          </Col>
        </Row>

        {/* Specs Row */}
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
                {specs.length > 0 ? (
                  specs.map((spec) => (
                    <Card
                      className='d-flex flex-1 flex-column gap-3 p-3 my-2 mx-2'
                      style={{ minWidth: "300px" }}
                      key={spec?.id}
                    >
                      <label className='app-label'>
                        {" "}
                        <span className='font-weight-bold'></span> {spec?.title}
                      </label>
                      <label style={{ lineHeight: "1.7" }} s>
                        {" "}
                        <span className='font-weight-bold '>الوصف:</span>{" "}
                        {spec?.content}
                      </label>
                      <label style={{ lineHeight: "1.7" }} s>
                        {" "}
                        <span className='font-weight-bold '>السعر:</span>{" "}
                        {spec?.price?.toFixed(2)}
                      </label>
                      {/* <label style={{ lineHeight: "1.7" }} s>
                        {" "}
                        <span className="font-weight-bold ">الربح:</span> {spec?.profit}
                      </label> */}
                      <label style={{ lineHeight: "1.7" }} s>
                        {" "}
                        <span className='font-weight-bold '>الكمية:</span>{" "}
                        {spec?.quantity}
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
        {
          user_type === "ADM" || isCanShowSelling ?

            <Row>
              <Col>
                <Card>
                  <Card.Header className=' border-bottom-0 pb-0'>
                    <div>
                      <div className='d-flex justify-content-between'>
                        <label className='main-content-label my-auto pt-2'>
                          عمليات البيع
                        </label>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <DataTableExtensions {...tableData}>
                      <DataTable
                        columns={columns}
                        defaultSortAsc={false}
                        // striped={true}
                        pagination
                        paginationPerPage={200}
                        paginationRowsPerPageOptions={[10, 20, 50, 100, 150, 200]}
                      />
                    </DataTableExtensions>
                  </Card.Body>
                </Card>

              </Col>
            </Row>
            : ''
        }
        {/* Purchases Row */}
        {
          user_type === "ADM" || isCanShowPurchases ?

            <Row className='row-sm'>
              <Col md={12} lg={12}>
                <Card className='custom-card'>
                  <Card.Header className=' border-bottom-0 pb-0'>
                    <div>
                      <div className='d-flex justify-content-between'>
                        <label className='main-content-label my-auto pt-2'>
                          عمليات الشراء الأخيرة
                        </label>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Body className=' d-flex gap-2 flex-wrap '>
                    {recentPurchases.length > 0 ? (
                      recentPurchases.map((item) => {
                        const statusClass = getStatusClass(item?.status);
                        return (


                          <Card
                            style={{ minWidth: "300px" }}
                            className='d-flex flex-1 flex-column gap-3 p-3 my-2 mx-2'
                            key={item?.id}
                          >
                            <label className='app-label'>
                              {" "}
                              <span className='font-weight-bold'>الباقة:</span>{" "}
                              {item?.Package?.title}
                            </label>
                            <label className='app-label'>
                              {" "}
                              <span className='font-weight-bold'>رقم الشراء:</span>{" "}
                              {item?.id}
                            </label>
                            <label className='app-label'>
                              {" "}
                              <span className='font-weight-bold'>
                                المبلغ الإجمالي:
                              </span>{" "}
                              {item?.total_price?.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                            </label>
                            <label className='app-label'>
                              {" "}
                              <span className='font-weight-bold'>الكمية:</span>{" "}
                              {item?.quantity}
                            </label>
                            <label className='app-label'>
                              {" "}
                              <span className='font-weight-bold'>الاسم:</span>{" "}
                              {item?.user?.name}
                            </label>
                            {/* <label className='app-label'>
                              {" "}
                              <span className='font-weight-bold'>
                                سعر الوحدة:
                              </span>{" "}
                              {item?.unit_price?.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                            </label> */}
                            <label className='app-label'>
                              {" "}
                              الحالة:{" "}
                              <button className={statusClass}>
                                {item?.status === "NEW"
                                  ? "جديد غير مدفوع"
                                  : item?.status === "PAID"
                                    ? "مدفوعة"
                                    : item?.status === "REJECTED"
                                      ? "مرفوضة"
                                      : item?.status === "SOLD"
                                        ? "مبيعة كاملة"
                                        : item?.status === "PENDING"
                                          ? "انتظار"
                                          : item?.status === "UPLOADED_FILE"
                                            ? "تم رفع الإيصال"
                                            : item?.status === "SOLD_PARTIALLY"
                                              ? "قائمة"

                                              : item?.status === "CANCELLED"
                                                ? "ملغية"
                                                : item?.status === "PAID_PARTIALLY"
                                                  ? "مدفوع جزئيا"
                                                  : item?.status === "PAYMENT_INITIATED"
                                                    ? " تمت محاولة الدفع"
                                                    : item?.status}
                              </button>
                            </label>
                            {/* <label className='app-label'>
                              {" "}
                              <span className='font-weight-bold'>الربح:</span>{" "}
                              {item?.profit?.toFixed(2)}
                            </label> */}

                            <div className='actions d-flex gap-3 '>
                              <Link
                                style={{ fontSize: "16px" }}
                                className='btn btn-primary px-4 py-2 rounded-5'
                                href={"/dashboard/pages/purchases/" + item?.id}
                              >
                                المزيد من التفاصيل
                              </Link>
                            </div>
                          </Card>
                        )
                      })
                    ) : (
                      <h4>لم يتم إضافة عمليات شراء مؤخرًا</h4>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            : ''
        }




        {otpPopup && (
          <OtpPopup
            setOtpPopup={setOtpPopup}
            otp={otp}
            setOtp={setOtp}
            saleOtp={saleOtp}
          />
        )}

        {/* <!-- End Row --> */}
        {sellingSetupPopup && (
          <SellingSetupPopup
            setSellingSetupPopup={setSellingSetupPopup}
            setupSelling={setupSelling}
            setLoading={setLoading}
            loading={loading}
            data={data}
            vat={vat}
            specs={specs}
            setOtpPopup={setOtpPopup}
            setData={setSendingData}
          />
        )}
        {editQuantityPopup && (
          <EditQuantityPopup
            setEditQuantityPopup={setEditQuantityPopup}
            oldQuantity={data?.quantity}
            setLoading={setLoading}
            loading={loading}
            id={id}
            haslimitToUser={data?.has_limit}
            limit={data?.limit_per_user}
            title={data?.title}
            shortdescription={data?.shortdescription}


          />
        )}

        {rejectPopup && <RejectPopup setRejectPopup={setRejectPopup} />}

        {submitPopup && <SubmitPopup setSubmitPopup={setSubmitPopup} />}

        {confirmPopup && (
          <ConfirmPopup
            setConfirmPopup={setConfirmPopup}
            sale={sale}
            confirmData={confirmData}
            loading={loading}
            setOtpPopup={setOtpPopup}
          />
        )}
      </div>
    </>
  );
};

Orders.layout = "Contentlayout";

export default Orders;

const OtpPopup = ({ setOtpPopup, otp, setOtp, saleOtp }) => {
  function onKeyPress(e) {
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  }

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await saleOtp();
    setLoading(false);
  };

  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)" }}
      className='pos-fixed top-50 left-50 translate-middle-y  w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4>ادخل كود التحقق الذي تم إرساله اليك</h4>
          <Form onSubmit={(e) => handleSubmit(e)} className='mt-4'>
            <Form.Group>
              <Form.Control
                autoFocus
                required
                maxLength={4}
                minLength={4}
                max={9999}
                min={0}
                onKeyPress={onKeyPress}
                style={{
                  fontSize: "20px",
                  padding: "30px",
                  textAlign: "center",
                  letterSpacing: "0.6em",
                }}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </Form.Group>
            <div className='d-flex justify-content-center gap-3 mt-4'>
              <Button type='submit' variant='primary px-5' disabled={loading}>
                {loading ? "جاري التحقق..." : "تحقق"}
              </Button>
              <Button
                variant='danger px-5'
                onClick={() => setOtpPopup(false)}
                className=''
                type='button'
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

const EditQuantityPopup = ({
  setEditQuantityPopup,
  loading,
  oldQuantity,
  setLoading,
  id,
  shortdescription,
  title,
  limit,
  haslimitToUser,

}) => {
  const { token, id: adminId, user_type } = user;

  const [quantity, setQuantity] = useState(oldQuantity);

  const [description, setDescription] = useState(shortdescription);
  const [packageTitle, setPackageTitle] = useState(title);
  const [hasLimit, setHasLimit] = useState(haslimitToUser ? haslimitToUser :false);
  const [limitPerUser, setLimitPerUser] = useState(limit ? limit : 0);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  async function handleEditQuantity(e) {
    e.preventDefault()
    const res = await fetch(
      `${baseUrl}/api/v1/admin_package/${id}/`,
      {
        method: "PATCH",
        body: JSON.stringify({ quantity, shortdescription: description, title: packageTitle ,limit_per_user :limitPerUser?limitPerUser :limit ,has_limit:hasLimit }),
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      },
    );
    const result = await res.json();

    if (res.status === 200 || res.ok) {
      toast.success(result.message || "تم تعديل الباقة بنجاح");
      setEditQuantityPopup(false)
    } else {
      toast.error("حدث خطأ ما");
    }
    setLoading(false);

  }

  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)" }}
      className='pos-fixed top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Header>
          <h3> تعديل الباقة</h3>
        </Card.Header>
        <Card.Body>
          <Form
            onSubmit={(e) =>
              handleEditQuantity(e)
            }
          >
            {/*{
                e.preventDefault();
                setOtpPopup(true);
                setSellingSetupPopup(false);
                setData({
                  price,
                  tax,
                  fee,
                  files,
                  quantity,
                  uniqueSpecs,
                });
              }*/}
            <Form.Group className='text-start form-group'>
              <Form.Label> الاسم</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل الاسم'
                name='quantity'
                type='text'
                value={packageTitle}
                onChange={(e) => setPackageTitle(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='text-start form-group'>
              <Form.Label> الوصف</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل الوصف'
                name='quantity'
                type='text'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='text-start form-group'>
              <Form.Label>الكمية الجديدة</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل الكمية'
                name='quantity'
                type='number'
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='text-start form-group text-xxl' controlId='formHasLimit' dir="ltr">
              <Form.Check
                type='checkbox'
                label='هل هناك حد أقصى للشراء لكل مستخدم؟'
                checked={hasLimit}
                onChange={(e) => setHasLimit(e.target.checked)}
                className="custom-checkbox" // Add a custom class for styling
                style={{ fontSize: "1rem" }} // Increase the font size
              />
            </Form.Group>


            <Form.Group className='text-start form-group' controlId='formLimitPerUser'>
              <Form.Label>الحد الأقصى للشراء لكل مستخدم</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل الحد الأقصى'
                name='limitPerUser'
                type='number'
                disabled={!hasLimit}
                value={limitPerUser}
                onChange={(e) => setLimitPerUser(e.target.value)}
                min={1}
                step={1}
                required
              />
            </Form.Group>





            <div className='d-flex gap-4'>
              <Button
                disabled={loading}
                type='submit'
                className='btn ripple btn-main-primary btn-block mt-2 disabled:opacity-50 '
              >
                {loading
                  ? "جار تسجيل البيانات  ..."
                  : "  تعديل"}
              </Button>
              <Button
                onClick={() => setEditQuantityPopup(false)}
                type='button'
                className='btn ripple btn-main-primary btn-block mt-2 '
              >
                الغاء
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};
const SellingSetupPopup = ({
  setSellingSetupPopup,
  setupSelling,
  loading,
  setLoading,
  data,
  vat,
  specs,
  setOtpPopup,
  setData,
}) => {
  const [price, setPrice] = useState(null);
  const [tax, setTax] = useState(null);
  const [fee, setFee] = useState(null);
  const [customerProfit, setCustomerProfit] = useState(null);
  const [customerCapital, setCustomerCapital] = useState(null);
  const [totalProfit, setTotalProfit] = useState(null);
  const [quantity, setQuantity] = useState(null);
  const [quantities, setQuantities] = useState([]);
  const [files, setFiles] = useState(null);
  const [multipliers, setMultipliers] = useState({});
  const [changeSource, setChangeSource] = useState(null); // 'multiplier' or 'quantity'
  const [finalSpecs, setFinalSpecs] = useState([]);
  const [spec, setSpec] = useState({
    id: "",
    sold: 0,
    price: 0,
  });

  const handleMultiplierChange = (e, specId, index) => {
    setChangeSource('multiplier'); // Mark that change came from multiplier
    const value = e.target.value;
    setMultipliers(prev => ({
      ...prev,
      [specId]: value
    }));
    
    // If multiplier has value, calculate quantity and disable quantity input
    if (value) {
      const calculatedQuantity = Number(value) * Number(specs[index].quantity); // Assuming each spec has a quantity property
      document.getElementById(`quantity-${index}`).value = calculatedQuantity;
      // document.getElementById(`quantity-${index}`).disabled = true;
      
      // Trigger the change event for the quantity input
      const event = {
        target: {
          value: calculatedQuantity.toString()
        }
      };
      handleChangeSpec(event, specs[index], true);
    } else {
      // If multiplier is empty, enable quantity input
      document.getElementById(`quantity-${index}`).disabled = false;
      document.getElementById(`quantity-${index}`).value = 0;
      
      // Trigger the change event with 0
      const event = {
        target: {
          value: "0"
        }
      };
      handleChangeSpec(event, specs[index] , true);
    }
  };

  const handleChangeSpec = (e, changedSpec , fromMultiplier = false) => {
       // Only clear multiplier if change came from quantity input
  if (!fromMultiplier) {
    setMultipliers(prev => ({
      ...prev,
      [changedSpec.id]: ""
    }));
  }
    let specTotalPrice = 0.0;
    let specTotalPriceNoVat = 0.0;
    let totalFinalSelling = 0.0;
    let totalPriceNoVat = 0.0;
    let totalProfit = 0.0;
    let specQuantity = 0;

    specs.forEach(function (spec, i) {
      const quantityInput = document.getElementById("quantity-" + i);
      specQuantity = quantityInput ? quantityInput.value : 0;

      specTotalPrice = parseFloat(spec.price * parseInt(specQuantity));
      specTotalPriceNoVat = parseFloat(
        (spec.price * parseInt(specQuantity)) / ((vat + 100) / 100),
      );

      setSpec({
        id: changedSpec.id,
        sold:  Number(e.target.value),
        price: changedSpec.price,
      });
      
      setFinalSpecs([
        ...finalSpecs,
        {
          id: changedSpec.id,
          sold: Number(e.target.value),
          price: changedSpec.price,
        },
      ]);

      totalFinalSelling +=
        (parseFloat(specTotalPriceNoVat) *
          ((data?.profit + 100) / 100) *
          (vat + 100)) /
        100;
      totalPriceNoVat += parseFloat(specTotalPriceNoVat);
      totalProfit += (parseFloat(specTotalPriceNoVat) * data?.profit) / 100;
    });

    let taxVal = totalProfit * (vat / 100);
    let fee = ((totalProfit * data?.commission) / 100) * ((vat + 100) / 100);
    let customerProfitVal =
      (totalProfit * (100 - data?.commission)) / 100 -
      ((totalProfit * data?.commission) / 100) * (vat / 100);
    let customerCapitalVal = totalPriceNoVat + customerProfitVal;

    setPrice(totalFinalSelling.toFixed(3));
    setFee(fee.toFixed(3));
    setTax(taxVal.toFixed(3));
    setCustomerProfit(customerProfitVal.toFixed(3));
    setCustomerCapital(customerCapitalVal.toFixed(3));
    setTotalProfit(totalProfit.toFixed(3));
  };

  const handleBlurSpec = (q, id) => {
    setFinalSpecs([...finalSpecs, { id: spec.id, sold: Number(q) }]);
  };

  const uniqueSpecs = [
    ...new Map(finalSpecs.map((item) => [item["id"], item])).values(),
  ];

  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)" }}
      className='pos-fixed top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" , height:'80vh', overflow:'auto' }}>
        <Card.Header>
          <h3>تسجيل بيع</h3>
        </Card.Header>
        <Card.Body>
          <Form
            onSubmit={(e) =>
              setupSelling(e, {
                price,
                tax,
                fee,
                files,
                quantity,
                uniqueSpecs,
              })
            }
          >
            {specs.length > 0 &&
              specs?.map((item, index) => (
                <div key={index} className="mb-3">
                  <Form.Label>
                    كمية بيع{" "}
                    <span
                      style={{
                        color: "#6e3070",
                        fontWeight: 900,
                        fontSize: 20,
                        marginRight: 5,
                        marginLeft: 5,
                      }}
                    >
                      {item?.title}
                    </span>{" "}
                    بالحبة
                  </Form.Label>
                  <div className="d-flex gap-2">
                  <div style={{ width: "140px" }}>
                      <Form.Control
                        className='form-control'
                        placeholder="المضاعف"
                        type='number'
                        min={0}
                        value={multipliers[item.id] || ""}
                        onChange={(e) => handleMultiplierChange(e, item.id, index)}
                      />
                    </div>
                    <Form.Control
                      className='form-control'
                      defaultValue={0}
                      min={0}
                      type='number'
                      id={"quantity-" + index}
                      onChange={(e) => {
                        setChangeSource('quantity');
                        handleChangeSpec(e, item);
                      }}
                      onBlur={(e) => handleBlurSpec(e.target.value, item?.id)}
                      required
                    />
                
                  </div>
                  {multipliers[item.id] && (
                    <small className="text-muted">
                      الكمية المحسوبة: {multipliers[item.id] * (item.quantity || 1)}
                    </small>
                  )}
                </div>
              ))}

            {/* Rest of your form remains the same */}
            <div className='row'>
              <div className='col-md-6'>
                <Form.Group
                  className='text-start form-group'
                  controlId='formEmail'
                >
                  <Form.Label>مبلغ البيع الإجمالي</Form.Label>
                  <h3 className='number-result'>
                    {Number(price).toLocaleString("en-US", {
                      maximumFractionDigits: 3,
                      minimumFractionDigits: 2,
                    })}
                  </h3>
                </Form.Group>
              </div>
              <div className='col-md-6'>
                <Form.Group
                  className='text-start form-group'
                  controlId='formEmail'
                >
                  <Form.Label>العائد على العملية البيعية</Form.Label>
                  <h3 className='number-result'>
                    {Number(totalProfit).toLocaleString("en-US", {
                      maximumFractionDigits: 3,
                      minimumFractionDigits: 2,
                    })}
                  </h3>
                </Form.Group>
              </div>
              <div className='col-md-6'>
                <Form.Group className='text-start form-group'>
                  <Form.Label>العمولة شامل الضريبة</Form.Label>
                  <h3 className='number-result'>
                    {Number(fee).toLocaleString("en-US", {
                      maximumFractionDigits: 3,
                      minimumFractionDigits: 2,
                    })}
                  </h3>
                </Form.Group>
              </div>
              <div className='col-md-6'>
                <Form.Group className='text-start form-group'>
                  <Form.Label>رأس المال بعد خصم الضريبة والعمولة</Form.Label>
                  <h3 className='number-result'>
                    {Number(customerCapital).toLocaleString("en-US", {
                      maximumFractionDigits: 3,
                      minimumFractionDigits: 2,
                    })}
                  </h3>
                </Form.Group>
              </div>
              <div className='col-md-6'>
                <Form.Group className='text-start form-group'>
                  <Form.Label>الربح الصافي للعميل</Form.Label>
                  <h3 className='number-result'>
                    {Number(customerProfit).toLocaleString("en-US", {
                      maximumFractionDigits: 3,
                      minimumFractionDigits: 2,
                    })}
                  </h3>
                </Form.Group>
              </div>
            </div>

            <Form.Group className='text-start form-group'>
              <Form.Label> إرفاق فواتير البيع </Form.Label>
              <Form.Control
                className='form-control'
                name='file'
                type='file'
                multiple
                onChange={(e) => setFiles(e.target.files)}
                required
              />
            </Form.Group>
            <div className='d-flex gap-4'>
              <Button
                disabled={loading}
                type='submit'
                className='btn ripple btn-main-primary btn-block mt-2 disabled:opacity-50 '
              >
                {loading
                  ? "جار تسجيل البيانات  ..."
                  : "استعراض استحقاق المستفيدين"}
              </Button>
              <Button
                onClick={() => setSellingSetupPopup(false)}
                type='button'
                className='btn ripple btn-main-primary btn-block mt-2 '
              >
                الغاء
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

const SubmitPopup = ({ setSubmitPopup }) => {
  const [loading, setLoading] = useState(false);
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
              onClick={() => { }}
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

const RejectPopup = ({ setRejectPopup }) => {
  const [loading, setLoading] = useState(false);
  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)" }}
      className='pos-fixed top-50 left-50 translate-middle-y  w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4>هل انت متاكد من رفض طلب الشراء </h4>
          <img src={trash.src} alt='trash' width={80} className='my-4' />
          <div className='d-flex justify-content-center gap-5'>
            <button
              className='btn btn-lg btn-danger px-5 '
              onClick={() => { }}
              disabled={loading}
              style={{ minWidth: "fit-content" }}
            >
              {loading ? "جاري التحميل ..." : "رفض"}
            </button>
            <button
              className='btn btn-lg btn-outline-dark px-5'
              onClick={() => setRejectPopup(false)}
            >
              إلغاء
            </button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

const ConfirmPopup = ({
  setConfirmPopup,
  sale,
  confirmData,
  loading,
  setOtpPopup,
  setData,
}) => {
  console.log("from confirm popoup");
  console.log(confirmData?.data?.preview);
  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)" }}
      className='pos-fixed top-50 left-50 translate-middle-y  w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" , height:'80vh', overflow:'auto' }}>
        <Card.Body className='text-center'>
          <h4>مراجعة تسجيل البيع</h4>
          <table
            className='table overflow-auto'
            width={555}
            style={{ maxHeight: "400px" }}
          >
            <thead>
              <tr>
                <th scope='col'>العميل</th>
                <th scope='col'>تاريخ التأكيد</th>
                <th scope='col'>المبلغ</th>
                <th scope='col'>البيع</th>
              </tr>
            </thead>
            <tbody>
              {confirmData?.data?.preview?.length > 0 ? (
                confirmData?.data?.preview?.map((row, index) => (
                  <tr key={index}>
                    <td>
                      {row?.user?.name} - {row?.user?.mobile}
                    </td>
                    <td>{getFormatedTime(row?.confirm_date) }</td>
                    <td>{row?.deserves?.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                    <td>{row?.package_spec?.title}</td>
                  </tr>
                ))
              ) : (
                <>
                  <h3 className='mt-3'>لا توجد مشتريات لهذه الباقة</h3>
                </>
              )}
            </tbody>
          </table>
          <div className='d-flex justify-content-center gap-5'>
            <button
              className='btn btn-lg btn-success px-5 '
              onClick={sale}
              disabled={loading}
              style={{ minWidth: "fit-content" }}
            >
              {loading ? "جاري التحميل ..." : "تأكيد"}
            </button>
            <button
              className='btn btn-lg btn-outline-dark px-5'
              onClick={() => setConfirmPopup(false)}
            >
              إلغاء
            </button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
