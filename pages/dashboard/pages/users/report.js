import React, { useEffect, useReducer, useState } from "react";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import { Button, Card, Col, Row, Table } from "react-bootstrap";

import "react-data-table-component-extensions/dist/index.css";
import Seo from "../../../../shared/layout-components/seo/seo";
import { useRouter } from "next/router";

const changeNumberFormate = (number, type) => {
  const changedNumber = new Intl.NumberFormat().format(number);
  if (type === "float") {
    const splitedNumber = changedNumber.split(".");
    let newNumber;
    if (splitedNumber[1] > 0) {
      if (splitedNumber[1].length === 1) {
        newNumber = splitedNumber[0] + "." + splitedNumber[1] + "00";
      } else if (splitedNumber[1].length === 2) {
        newNumber = splitedNumber[0] + "." + splitedNumber[1] + "0";
      } else if (splitedNumber[1].length === 3) {
        newNumber = splitedNumber[0] + "." + splitedNumber[1];
      }
    } else {
      newNumber = splitedNumber[0] + ".000";
    }
    return newNumber;
  } else if (type === "int") {
    return changedNumber;
  }
};

import { getUserCookies } from "../../../../utils/getUserCookies";
import { Link } from "@mui/material";
import logout from "../../../../utils/logout";

const user = getUserCookies();

const Orders = () => {
  const [data, setData] = useState([]);
  const [userData, setUserData] = useState([]);

  const router = useRouter();
  const id = router.query.id;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const purchases = data?.report;
  const { token, id: adminId, user_type } = user;

  const getTotalSalesAmount = (sales) => {
    let totalAmout = 0;
    sales?.forEach((sale) => {
      totalAmout += sale?.amount;
    });
    return changeNumberFormate(totalAmout, "float");
  };

  const getTotalTransfers = () => {
    let total = 0;
    purchases?.forEach((purchase) => {
      total += purchase?.transfers;
    });

    return changeNumberFormate(total, "float");
  };

  const getTotalRemanings = () => {
    let total = 0;
    purchases?.forEach((purchase) => {
      total += purchase?.remaining;
    });
    return changeNumberFormate(total, "float");
  };

  const getTotalStocks = () => {
    let total = 0;
    purchases?.forEach((purchase) => {
      total += purchase?.stocks;
    });
    return changeNumberFormate(total, "float");
  };

  const getUserData = async () => {
    const res = await fetch(
      `
${baseUrl}/api/v1/customer/${id}/`,{
  headers: { "Authorization": token }
}
    );
    if(res.status == 401){
      logout()
    }
    const data = await res.json();
    setUserData(data?.data);
  };


  useEffect(() => {
    getUserData();
    fetch(`${baseUrl}/api/v1/get_customer_report/${id}/`,{
      headers: { "Authorization": token }
    })
    .then((res) => {
      if (res.status === 401) {
        logout();
        return;
      }
      return res.json();
    })
      .then((data) => {
        setData(data)
        console.log(data)
      });
  }, [id]);

  return (
    <>
      <Seo title='تقارير العملاء' />

      <PageHeader
        title='تقارير العملاء'
        item='شركة وحيد'
        active_item={"تقارير " + userData?.name}
      />

      <div>
        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 '>
                <div style={{ marginBottom: "15px" }}>
                  <div className='d-flex'>
                    <label className='main-content-label my-auto '>
                      تقارير العميل {userData?.name}
                    </label>
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                {purchases?.map((p, i) => (
                  <Table bordered key={i} className='mb-4'>
                    <thead className='bg-light'>
                      <tr>
                        <th className='w-50'>{p?.purchase?.Package?.title}</th>
                        <th className='w-50'>القيمة</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>  شراء <span className="m-2"> {p?.purchase?.datetime}</span> </td>
                        <td>
                          {changeNumberFormate(
                            p?.purchase?.total_price,
                            "float",
                          )}
                        </td>
                      </tr>
                      {p?.sales?.map((s, i) => (
                        <tr key={i}>
                          <td>بيع  <span className="m-2"> {s?.created_at}</span> </td>
                          <td>{changeNumberFormate(s?.amount, "float")}</td>
                        </tr>
                      ))}
                      <tr>
                        <td>مجموع البيع للباقة</td>
                        <td>{getTotalSalesAmount(p?.sales)}</td>
                      </tr>
                      <tr>
                        <td>مجموع ماتم تحويله من قيمة مستحقات الباقة </td>
                        <td>
                          {changeNumberFormate(p?.transfers || 0, "float")}
                        </td>
                      </tr>
                      <tr>
                        <td>المتبقي مماتم تحويله من قيمة مستحقات الباقة </td>
                        <td>{changeNumberFormate(p?.remaining, "float")}</td>
                      </tr>
                      <tr>
                        <td>قيمة المخزون</td>
                        <td>{changeNumberFormate(p?.stocks, "float")}</td>
                      </tr>

                      <Link
                        className='font-weight-bold text-primary text-center p-2 d-block w-100 mx-auto'
                        href={`/dashboard/pages/purchases/${p?.purchase?.id}`}
                        style={{ fontSize: "16px" }}
                      >
                        تفاصيل عملية الشراء
                      </Link>
                    </tbody>
                  </Table>
                ))}
                <div
                  className='
            d-flex justify-content-between flex-wrap'
                >
                  <h4
                    className='font-weight-bold text-primary flex-1 mt-2'
                    style={{ minWidth: "fit-content" }}
                  >
                    إجمالي التحويلات: {getTotalTransfers()}
                  </h4>
                  <h4
                    className='font-weight-bold text-primary flex-1 mt-2'
                    style={{ minWidth: "fit-content" }}
                  >
                    إجمالي المتبقي : {getTotalRemanings()}
                  </h4>
                  <h4
                    className='font-weight-bold text-primary flex-1 mt-2'
                    style={{ minWidth: "fit-content" }}
                  >
                    إجمالي المخزون : {getTotalStocks()}
                  </h4>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {/* <!-- End Row --> */}
      </div>
    </>
  );
};

Orders.layout = "Contentlayout";

export default Orders;
