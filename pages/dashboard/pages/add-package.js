import React, { useEffect, useState } from "react";
import PageHeader from "../../../shared/layout-components/page-header/page-header";
import { Card, Form, Button } from "react-bootstrap";
import Seo from "../../../shared/layout-components/seo/seo";
import { toast } from "react-toastify";

import { useRouter } from "next/router";
import { getUserCookies } from "../../../utils/getUserCookies";
import logout from "../../../utils/logout";

const admin = getUserCookies();

const AddPackage = () => {
  const router = useRouter();

  const [price, setPrice] = useState(0.0);
  const [profit, setProfit] = useState(0.0);
  const [commission, setCommission] = useState(0.0);
  const [quantity, setQuantity] = useState(null);
  const [files, setFiles] = useState(null);
  const [title, setTitle] = useState("");
  const [hasLimit, setHasLimit] = useState(false);
  const [limitPerUser, setLimitPerUser] = useState(0);
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [vat, setVat] = useState(0.0);
  const [availabilityCountry, setAvailabilityCountry] = useState("saudi");
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  useEffect(() => {
    fetch(`${baseUrl}/api/v1/company-info/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `${admin.token}`,
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
      .then((data) => {
        const vat = data?.data?.info?.vat_percentage;
        setVat((+vat + 100) / 100);

      })
      .catch(() => {
        // ignore errors, we'll fallback to country-based VAT
      });
  }, []);

  useEffect(() => {
    if (availabilityCountry === "saudi") {
      setVat(1.15);
    } else if (availabilityCountry === "uae") {
      setVat(1.05);
    }
  }, [availabilityCountry]);

  console.log("vaaaaaaaattttttttttttttt");
  console.log(vat);
  console.log("vaaaaaaaattttttttttttttt");

  const [specs, setSpecs] = useState(0);

  const [totalPrice, setTotalPrice] = useState(0);
  const [err, setErr] = useState("");

  const [finalItems, setFinalItems] = useState([]);

  const [item, setItem] = useState({
    title: "",
    description: "",
    price: "",
    quantity: "",
  });

  const addPackage = async (e, data) => {
    e.preventDefault();
    setLoading(true);

    const { price, title, desc, quantity, profit, commission, files, specs, hasLimit,
      limitPerUser, availabilityCountry } =
      data;
    console.log(data);
    const fd = new FormData();
    fd.append("price", price);
    fd.append("title", title);
    fd.append("shortdescription", desc);
    fd.append("quantity", +quantity);
    fd.append("profit", profit);
    fd.append("commission", commission);
    fd.append("admin_id", admin.id);
    fd.append("has_limit", hasLimit);
    fd.append("limit_per_user", limitPerUser);
    fd.append("availability_country", availabilityCountry);
    files?.length > 0 && fd.append("image_file", files[0]);
    specs.forEach((spec) => {
      fd.append("spec_title[]", spec.title);
      fd.append(
        "spec_price[]",
        parseFloat(spec.price).toFixed(3).toLocaleString("en-US", {
          maximumFractionDigits: 3,
          minimumFractionDigits: 2,
        }),
      );
      fd.append("spec_quantity[]", spec.quantity);
      fd.append("spec_description[]", spec.description);
    });

    const res = await fetch(`${baseUrl}/api/v1/package/`, {
      method: "POST",
      body: fd,
      headers: {
        Authorization: admin.token,
      },
    });
    if (res.status == 401) {
      logout()
    }
    const result = await res.json();

    console.log(result);

    if (res.status === 201 && result.success) {
      toast.success("تم الإضافة بنجاح");
      // forceUpdate();
      // setAddPackagePopup(false);
      setTitle("");
      setDesc("");
      setPrice("");
      setQuantity("");
      setProfit("");
      setCommission("");
      setSpecs(0);
      setHasLimit(false);
      setLimitPerUser(0);
      setAvailabilityCountry("both");
      setFinalItems([]);
      router.push("/dashboard/pages/packages/");
      setLoading(false);
    } else {
      toast.error(result.message || "حدث خطأ ما");
      setLoading(false);
    }

    setLoading(false);
    e.target.reset();
  };

  console.log("finalItems");
  console.log(finalItems);

  const calculateSum = () => {
    let itemsArray = finalItems;
    let tempTotal = 0;
    finalItems.forEach((item) => {
      console.log(`item.price*item.quantity`);
      console.log(item.price * item.quantity);
      console.log(item.quantity);
      console.log(item.price);
      tempTotal += item.price * item.quantity;
    });
    console.log("TOOOOOOOOOOOOOOOTAL");
    console.log(tempTotal);
    setTotalPrice(tempTotal);
  };

  const addFirstSpec = () => {
    setErr("");
    setSpecs((prev) => prev + 1);
    setFinalItems((prev) => {
      return [
        ...prev,
        {
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          description: item.description,
        },
      ];
    });

    // setItem({
    //   title: "",
    //   price: "",
    //   quantity: "",
    //   description: "",
    // });

    calculateSum();
  };

  return (
    <>
      <Seo title='إضافة باقة' />

      <PageHeader
        title='إضافة باقة'
        item='شركة وحيد'
        active_item='إضافة باقة'
      />
      <div>
        <Card>
          <Card.Header>
            <h3>باقة جديدة</h3>
          </Card.Header>
          <Card.Body>
            <Form
              onSubmit={(e) =>
                addPackage(e, {
                  price: +totalPrice,
                  profit: +profit,
                  commission: +commission,
                  files,
                  quantity: +quantity,
                  title,
                  desc,
                  specs: finalItems,
                  hasLimit,
                  limitPerUser,
                  availabilityCountry,
                })
              }
            >
              <Form.Group
                className='text-start form-group'
                controlId='formEmail'
              >
                <Form.Label>اسم الباقة</Form.Label>
                <Form.Control
                  className='form-control'
                  placeholder='ادخل اسم الباقة'
                  name='title'
                  type='text'
                  value={title}
                  onChange={(e) => {
                    setErr("");
                    setTitle(e.target.value);
                  }}
                  required
                />
              </Form.Group>

              <Form.Group
                className='text-start form-group'
                controlId='formEmail'
              >
                <Form.Label>الكمية</Form.Label>
                <Form.Control
                  className='form-control'
                  placeholder='الكمية'
                  name='quantity'
                  type='number'
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min={1}
                  step={1}
                  required
                />
              </Form.Group>

         

              {/* <Form.Group
                className='text-start form-group'
                controlId='formpassword'
              >
                <Form.Label>الكمية الأولية</Form.Label>
                <Form.Control
                  className='form-control'
                  placeholder='ادخل الكمية الأولية'
                  name='quantity'
                  type='number'
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </Form.Group> */}

              <Form.Group className='text-start form-group'>
                <Form.Label> إرفاق صورة الباقة </Form.Label>
                <Form.Control
                  className='form-control'
                  name='files'
                  type='file'
                  multiple
                  onChange={(e) => setFiles(e.target.files)}
                />
              </Form.Group>
              <Form.Group className='text-start form-group'>
                <Form.Label>وصف الباقة</Form.Label>
                <textarea
                  className='form-control'
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={5}
                  placeholder='ادخل الوصف الخاص بالباقة'
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
                  value={limitPerUser}
                  onChange={(e) => setLimitPerUser(e.target.value)}
                  min={1}
                  step={1}
                  required
                />
              </Form.Group>

              <Form.Group className='text-start form-group' controlId='formAvailabilityCountry'>
                <Form.Label>دولة التوفر</Form.Label>
                <Form.Select
                  className='form-control'
                  style={{paddingRight: "40px"}}
                  name='availabilityCountry'
                  value={availabilityCountry}
                  onChange={(e) => setAvailabilityCountry(e.target.value)}
                  required
                >
                  <option value="uae">الإمارات</option>
                  <option value="saudi">السعودية</option>
                  {/* <option value="both">كلاهما</option> */}
                </Form.Select>
              </Form.Group>

              <hr className='mt-5' />

              {err && (
                <h5
                  className='rounded'
                  style={{
                    color: "red",
                    fontWeight: "bold",
                  }}
                >
                  {err}
                </h5>
              )}
              {specs === 0 && (
                <Button className='my-3' onClick={addFirstSpec}>
                  إضافة عنصر جديد +
                </Button>
              )}
              <SpecsForm
                specs={specs}
                setSpecs={setSpecs}
                setTotalPrice={setTotalPrice}
                setItem={setItem}
                item={item}
                finalItems={finalItems}
                setFinalItems={setFinalItems}
                totalPrice={totalPrice}
              />
              {/* {finalItems[finalItems.length-1]} */}
              <hr className='mt-3' />
              <div className='d-flex gap-4 align-items-center'>
                <h4 className='text-center w-50 pt-3'>
                  السعر الإجمالي :{" "}
                  <span className='bg-success px-3 rounded'>
                    {totalPrice < 0
                      ? 0
                      : Number(totalPrice.toFixed(3)).toLocaleString("en-US", {
                        maximumFractionDigits: 3,
                        minimumFractionDigits: 2,
                      })}
                  </span>{" "}
                  ريال شامل الضريبة
                </h4>
                <h4 className='text-center w-50 pt-3'>
                  {" "}
                  <span className='bg-success px-3 rounded'>
                    {totalPrice < 0
                      ? 0
                      : Number((totalPrice / vat).toFixed(3)).toLocaleString(
                        "en-US",
                        {
                          maximumFractionDigits: 3,
                          minimumFractionDigits: 2,
                        },
                      )}
                  </span>{" "}
                  ريال بدون الضريبة
                </h4>
              </div>

              <br />
              <br />
              <Form.Group
                className='text-start form-group'
                controlId='formpassword'
              >
                <Form.Label>نسبة الربح %</Form.Label>
                <Form.Control
                  className='form-control'
                  placeholder='ادخل نسبة الربح'
                  name='profit'
                  type='number'
                  value={profit}
                  onChange={(e) => e.target.value > 0 ? setProfit(e.target.value) : setProfit('')}
                  onKeyPress={(e) => {
                    let value = e.target.value;
                    if (value.includes(".")) {
                      if (value.split(".")[1].length >= 10) {
                        e.preventDefault();
                      }
                    }
                  }}
                  required
                  min={0}
                  step={0.0000000001}
                />
              </Form.Group>
              <h4>
                البيع النهائي شامل الضريبة
                <br />
                <h3 className='number-result create-package-numbers'>
                  {Number(
                    (totalPrice + (profit * totalPrice) / 100).toFixed(3),
                  ).toLocaleString("en-US", {
                    maximumFractionDigits: 3,
                    minimumFractionDigits: 2,
                  })}{" "}
                  ريال
                </h3>
              </h4>

              <br />
              <h4>
                العائد على العملية البيعية
                <br />
                <h3 className='number-result create-package-numbers'>
                  {Number(
                    ((profit * totalPrice) / 100 / vat).toFixed(3),
                  ).toLocaleString("en-US", {
                    maximumFractionDigits: 3,
                    minimumFractionDigits: 2,
                  })}{" "}
                  ريال
                </h3>
              </h4>

              <hr className='mt-3' />

              <Form.Group
                className='text-start form-group'
                controlId='formpassword'
              >
                <Form.Label> نسبة العمولة من الربح %</Form.Label>
                <Form.Control
                  className='form-control'
                  placeholder='نسبة العمولة من الربح'
                  name='commission'
                  type='number'
                  max={100}
                  min={0.01}
                  step={0.0000000001}
                  value={commission}
                  onKeyPress={(e) => {
                    let value = e.target.value;
                    if (value.includes(".")) {
                      if (value.split(".")[1].length >= 10) {
                        e.preventDefault();
                      }
                    }
                  }}
                  onChange={(e) => e.target.value > 0 ? setCommission(e.target.value) : setCommission('')}
                  required
                />
              </Form.Group>
              <h4>
                عمولة التسويق شامل الضريبة
                <br />
                <h3 className='number-result create-package-numbers'>
                  {Number(
                    (
                      (((profit * totalPrice) / 100) * commission) /
                      100
                    ).toFixed(3),
                  ).toLocaleString("en-US", {
                    maximumFractionDigits: 3,
                    minimumFractionDigits: 2,
                  })}{" "}
                  ريال
                </h3>
              </h4>

              <h4>
                صافي ربح العميل
                <br />
                <h3 className='number-result create-package-numbers'>
                  {Number(
                    (
                      (profit * totalPrice) / 100 / vat -
                      (((profit * totalPrice) / 100) * commission) / 100 -
                      (totalPrice / vat) * (vat-1)
                    ).toFixed(3),
                  ).toLocaleString("en-US", {
                    maximumFractionDigits: 3,
                    minimumFractionDigits: 2,
                  })}{" "}
                  ريال
                </h3>
              </h4>

              <h4>
                رأس مال العميل بعد خصم الضريبة والعمولة
                <br />
                <h3 className='number-result create-package-numbers'>
                  {Number(
                    (
                      (profit * totalPrice) / 100 / vat -
                      (((profit * totalPrice) / 100) * commission) / 100 +
                      totalPrice / vat
                    ).toFixed(3),
                  ).toLocaleString("en-US", {
                    maximumFractionDigits: 3,
                    minimumFractionDigits: 2,
                  })}{" "}
                  ريال
                </h3>
              </h4>
              <h4>
                نسبة العائد للعميل بعد البيع
                <br />
                <h3 className='number-result create-package-numbers'>
                  {Number(
                    ((((profit * totalPrice) / 100 / vat - (((profit * totalPrice) / 100) * commission) / 100 - (totalPrice / vat) * (vat-1) )) / (totalPrice) ) * 100
                  ).toLocaleString("en-US", {
                    maximumFractionDigits: 3,
                    minimumFractionDigits: 2,
                  })}{" "}
                  %
                </h3>
              </h4>


              <br />
              <br />

              <Button
                disabled={loading}
                type='submit'
                className='btn ripple btn-main-primary btn-block mt-2 disabled:opacity-50 w-50'
              >
                {loading ? "جار الإضافة..." : "إضافة الباقة "}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

AddPackage.layout = "Contentlayout";

export default AddPackage;

const SpecsForm = ({
  specs,
  setSpecs,
  setTotalPrice,
  setItem,
  item,
  finalItems,
  setFinalItems,
  totalPrice,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  //* last item price and quantity
  const [lastPrice, setLastPrice] = useState("");
  const [lastQuantity, setLastQuantity] = useState("");

  const [err, setErr] = useState("");

  const createNewSpec = () => {
    setSpecs((prev) => prev + 1);

    setFinalItems((prev) => {
      return [
        ...prev,
        {
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          description: item.description,
        },
      ];
    });

    // setItem({
    //   title: "",
    //   price: "",
    //   quantity: "",
    //   description: "",
    // });
    calculateSum();
  };
  const deleteSpec = () => {
    setSpecs((prev) => prev - 1);
    setFinalItems((prev) => {
      return prev.filter((ele, index) => {
        return index !== prev.length - 1;
      });
    });
    setTotalPrice(totalPrice - lastPrice * lastQuantity);
  };

  console.log("***********************************************");
  console.log("lastPrice", lastPrice);
  console.log("lastQuantity", lastQuantity);
  console.log("***********************************************");

  const handleChangePrice = (e, index) => {
    let array = finalItems;
    array[index].price = e.target.value;
    setFinalItems(array);
    setLastPrice(e.target.value);
    setErr("");
  };
  const handleChangeQuantity = (e, index) => {
    let array = finalItems;
    array[index].quantity = e.target.value;
    setFinalItems(array);
    setLastQuantity(e.target.value);
    setErr("");
  };
  const handleChangeTitle = (e, index) => {
    let array = finalItems;
    array[index].title = e.target.value;
    setFinalItems(array);
    setErr("");
  };
  const handleChangeDescription = (e, index) => {
    let array = finalItems;
    array[index].description = e.target.value;
    setFinalItems(array);
    setErr("");
  };

  const calculateSum = () => {
    let itemsArray = finalItems;
    let tempTotal = 0;
    finalItems.forEach((item) => {
      console.log(`item.price*item.quantity`);
      console.log(item.price * item.quantity);
      console.log(item.quantity);
      console.log(item.price);
      tempTotal += item.price * item.quantity;
    });
    console.log("TOOOOOOOOOOOOOOOTAL");
    console.log(tempTotal);
    setTotalPrice(tempTotal);
  };

  return (
    <>
      {Array(specs)
        .fill()
        .map((_, index) => (
          <div key={index} className='item-form'>
            {specs > 0 && (
              <h4 className='bg-light p-2 px-3 rounded'>{index + 1}</h4>
            )}
            <Form.Group className=' form-group'>
              <Form.Label>عنوان العنصر</Form.Label>
              <Form.Control
                type='text'
                placeholder='ادخل عنوان العنصر'
                required
                onChange={(e) => {
                  handleChangeTitle(e, index);
                }}
                name='title'
              // value={index + 1 < specs ? title : item.title}
              />
            </Form.Group>
            <Form.Group className=' form-group'>
              <Form.Label>وصف العنصر</Form.Label>
              <Form.Control
                type='text'
                as='textarea'
                rows={3}
                placeholder='ادخل وصف العنصر'
                required
                onChange={(e) => {
                  handleChangeDescription(e, index);
                  setDescription(e.target.value);
                }}
                name='description'
              // value={index + 1 < specs ? item.description : description}
              />
            </Form.Group>
            <Form.Group className=' form-group'>
              <Form.Label>السعر شامل الضريبة</Form.Label>
              <Form.Control
                type='number'
                placeholder='ادخل السعر شامل الضريبة'
                required
                min={0}
                step={0.01}
                onKeyPress={(e) => {
                  let value = e.target.value;
                  if (value.includes(".")) {
                    if (value.split(".")[1].length >= 3) {
                      e.preventDefault();
                    }
                  }
                }}
                onChange={(e) => {
                  handleChangePrice(e, index);
                  calculateSum();
                }}
                name='price'
              // value={index + 1 < specs ? price : item.price}
              />
            </Form.Group>
            <Form.Group className=' form-group'>
              <Form.Label>الكمية</Form.Label>
              <Form.Control
                onChange={(e) => {
                  handleChangeQuantity(e, index);
                  calculateSum();
                }}
                type='number'
                placeholder='ادخل الكمية'
                required
                min={0}
                step={1}
                name='quantity'
              // value={index + 1 < specs ? quantity : item.quantity}
              />
            </Form.Group>
          </div>
        ))}
      {err && (
        <h5
          className='rounded pb-2'
          style={{
            color: "red",
            fontWeight: "bold",
          }}
        >
          {err}
        </h5>
      )}
      {specs > 0 && (
        <div className='d-flex gap-3'>
          <Button type='button' onClick={createNewSpec}>
            إضافة عنصر جديد +{" "}
          </Button>
          <button className='btn btn-danger' type='button' onClick={deleteSpec}>
            حذف العنصر السابق
          </button>
        </div>
      )}
    </>
  );
};
