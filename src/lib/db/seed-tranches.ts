/**
 * Static tranche master for issue/maturity/coupon metadata.
 * Ingest enriches from NSE/BSE; this fills gaps when archives omit dates.
 * Units are typically 1 gram gold per bond. Coupon is 2.5% p.a. on issue price.
 */
export type SeedTranche = {
  isin: string;
  tranche_code: string;
  nse_symbol: string;
  bse_scrip_code?: string;
  issue_date: string;
  maturity_date: string;
  issue_price: number;
  coupon_pa?: number;
  units_per_bond?: number;
};

export const SEED_TRANCHES: SeedTranche[] = [
  { isin: "IN0020160085", tranche_code: "SGBNOV26", nse_symbol: "SGBNOV26", issue_date: "2016-11-17", maturity_date: "2026-11-17", issue_price: 2955 },
  { isin: "IN0020160101", tranche_code: "SGBDEC26", nse_symbol: "SGBDEC26", issue_date: "2016-12-28", maturity_date: "2026-12-28", issue_price: 2769 },
  { isin: "IN0020160119", tranche_code: "SGBMAR27", nse_symbol: "SGBMAR27", issue_date: "2017-03-17", maturity_date: "2027-03-17", issue_price: 2907 },
  { isin: "IN0020170019", tranche_code: "SGBAUG27", nse_symbol: "SGBAUG27", issue_date: "2017-08-04", maturity_date: "2027-08-04", issue_price: 2788 },
  { isin: "IN0020170027", tranche_code: "SGBSEP27", nse_symbol: "SGBSEP27", issue_date: "2017-09-12", maturity_date: "2027-09-12", issue_price: 2964 },
  { isin: "IN0020170035", tranche_code: "SGBOCT27", nse_symbol: "SGBOCT27", issue_date: "2017-10-23", maturity_date: "2027-10-23", issue_price: 2964 },
  { isin: "IN0020170043", tranche_code: "SGBDEC27", nse_symbol: "SGBDEC27", issue_date: "2017-12-04", maturity_date: "2027-12-04", issue_price: 2926 },
  { isin: "IN0020170068", tranche_code: "SGBJAN28", nse_symbol: "SGBJAN28I", issue_date: "2018-01-30", maturity_date: "2028-01-30", issue_price: 2916 },
  { isin: "IN0020170092", tranche_code: "SGBMAR28", nse_symbol: "SGBMAR28I", issue_date: "2018-03-13", maturity_date: "2028-03-13", issue_price: 3041 },
  { isin: "IN0020180017", tranche_code: "SGBOCT28", nse_symbol: "SGBOCT28I", issue_date: "2018-10-23", maturity_date: "2028-10-23", issue_price: 3146 },
  { isin: "IN0020180033", tranche_code: "SGBDEC28", nse_symbol: "SGBDEC28V", issue_date: "2018-12-04", maturity_date: "2028-12-04", issue_price: 3066 },
  { isin: "IN0020180066", tranche_code: "SGBJAN29", nse_symbol: "SGBJAN29VI", issue_date: "2019-01-15", maturity_date: "2029-01-15", issue_price: 3148 },
  { isin: "IN0020180090", tranche_code: "SGBFEB29", nse_symbol: "SGBFEB29VII", issue_date: "2019-02-12", maturity_date: "2029-02-12", issue_price: 3326 },
  { isin: "IN0020180108", tranche_code: "SGBMAR29", nse_symbol: "SGBMAR29VIII", issue_date: "2019-03-11", maturity_date: "2029-03-11", issue_price: 3173 },
  { isin: "IN0020190040", tranche_code: "SGBJUN29", nse_symbol: "SGBJUN29IX", issue_date: "2019-06-11", maturity_date: "2029-06-11", issue_price: 3199 },
  { isin: "IN0020190065", tranche_code: "SGBJUL29", nse_symbol: "SGBJUL29X", issue_date: "2019-07-16", maturity_date: "2029-07-16", issue_price: 3443 },
  { isin: "IN0020190081", tranche_code: "SGBAUG29", nse_symbol: "SGBAUG29XI", issue_date: "2019-08-14", maturity_date: "2029-08-14", issue_price: 3489 },
  { isin: "IN0020190099", tranche_code: "SGBSEP29", nse_symbol: "SGBSEP29XII", issue_date: "2019-09-17", maturity_date: "2029-09-17", issue_price: 3796 },
  { isin: "IN0020190115", tranche_code: "SGBOCT29", nse_symbol: "SGBOCT29XIII", issue_date: "2019-10-15", maturity_date: "2029-10-15", issue_price: 3788 },
  { isin: "IN0020200062", tranche_code: "SGBAPR30", nse_symbol: "SGBAPR30I", issue_date: "2020-04-28", maturity_date: "2030-04-28", issue_price: 4591 },
  { isin: "IN0020200070", tranche_code: "SGBMAY30", nse_symbol: "SGBMAY30II", issue_date: "2020-05-18", maturity_date: "2030-05-18", issue_price: 4590 },
  { isin: "IN0020200096", tranche_code: "SGBJUN30", nse_symbol: "SGBJUN30III", issue_date: "2020-06-16", maturity_date: "2030-06-16", issue_price: 4586 },
  { isin: "IN0020200104", tranche_code: "SGBJUL30", nse_symbol: "SGBJUL30IV", issue_date: "2020-07-14", maturity_date: "2030-07-14", issue_price: 4807 },
  { isin: "IN0020200153", tranche_code: "SGBAUG30", nse_symbol: "SGBAUG30V", issue_date: "2020-08-11", maturity_date: "2030-08-11", issue_price: 5312 },
  { isin: "IN0020200187", tranche_code: "SGBSEP30", nse_symbol: "SGBSEP30VI", issue_date: "2020-09-08", maturity_date: "2030-09-08", issue_price: 5177 },
  { isin: "IN0020200195", tranche_code: "SGBOCT30", nse_symbol: "SGBOCT30VII", issue_date: "2020-10-13", maturity_date: "2030-10-13", issue_price: 5038 },
  { isin: "IN0020200278", tranche_code: "SGBNOV30", nse_symbol: "SGBNOV30VIII", issue_date: "2020-11-10", maturity_date: "2030-11-10", issue_price: 5044 },
  { isin: "IN0020200385", tranche_code: "SGBJAN31", nse_symbol: "SGBJAN31IX", issue_date: "2021-01-12", maturity_date: "2031-01-12", issue_price: 5009 },
  { isin: "IN0020200393", tranche_code: "SGBFEB31", nse_symbol: "SGBFEB31X", issue_date: "2021-02-09", maturity_date: "2031-02-09", issue_price: 5011 },
  { isin: "IN0020210061", tranche_code: "SGBMAY31", nse_symbol: "SGBMAY31I", issue_date: "2021-05-25", maturity_date: "2031-05-25", issue_price: 4777 },
  { isin: "IN0020210087", tranche_code: "SGBJUN31", nse_symbol: "SGBJUN31II", issue_date: "2021-06-29", maturity_date: "2031-06-29", issue_price: 4805 },
  { isin: "IN0020210095", tranche_code: "SGBJUL31", nse_symbol: "SGBJUL31III", issue_date: "2021-07-28", maturity_date: "2031-07-28", issue_price: 4807 },
  { isin: "IN0020210152", tranche_code: "SGBAUG31", nse_symbol: "SGBAUG31IV", issue_date: "2021-08-31", maturity_date: "2031-08-31", issue_price: 4732 },
  { isin: "IN0020210186", tranche_code: "SGBSEP31", nse_symbol: "SGBSEP31V", issue_date: "2021-09-28", maturity_date: "2031-09-28", issue_price: 4735 },
  { isin: "IN0020210202", tranche_code: "SGBOCT31", nse_symbol: "SGBOCT31VI", issue_date: "2021-10-29", maturity_date: "2031-10-29", issue_price: 4770 },
  { isin: "IN0020210228", tranche_code: "SGBNOV31", nse_symbol: "SGBNOV31VII", issue_date: "2021-11-30", maturity_date: "2031-11-30", issue_price: 4783 },
  { isin: "IN0020210251", tranche_code: "SGBDEC31", nse_symbol: "SGBDEC31VIII", issue_date: "2021-12-28", maturity_date: "2031-12-28", issue_price: 4787 },
  { isin: "IN0020210285", tranche_code: "SGBJAN32", nse_symbol: "SGBJAN32IX", issue_date: "2022-01-25", maturity_date: "2032-01-25", issue_price: 4783 },
  { isin: "IN0020210319", tranche_code: "SGBFEB32", nse_symbol: "SGBFEB32X", issue_date: "2022-02-22", maturity_date: "2032-02-22", issue_price: 4977 },
  { isin: "IN0020220011", tranche_code: "SGBJUN32", nse_symbol: "SGBJUN32I", issue_date: "2022-06-28", maturity_date: "2032-06-28", issue_price: 5091 },
  { isin: "IN0020220029", tranche_code: "SGBJUL32", nse_symbol: "SGBJUL32II", issue_date: "2022-07-26", maturity_date: "2032-07-26", issue_price: 5097 },
  { isin: "IN0020220052", tranche_code: "SGBAUG32", nse_symbol: "SGBAUG32III", issue_date: "2022-08-23", maturity_date: "2032-08-23", issue_price: 5191 },
  { isin: "IN0020220060", tranche_code: "SGBSEP32", nse_symbol: "SGBSEP32IV", issue_date: "2022-09-20", maturity_date: "2032-09-20", issue_price: 5197 },
  { isin: "IN0020220086", tranche_code: "SGBOCT32", nse_symbol: "SGBOCT32V", issue_date: "2022-10-18", maturity_date: "2032-10-18", issue_price: 5191 },
  { isin: "IN0020220102", tranche_code: "SGBNOV32", nse_symbol: "SGBNOV32VI", issue_date: "2022-11-22", maturity_date: "2032-11-22", issue_price: 5327 },
  { isin: "IN0020220128", tranche_code: "SGBDEC32", nse_symbol: "SGBDEC32VII", issue_date: "2022-12-27", maturity_date: "2032-12-27", issue_price: 5410 },
  { isin: "IN0020220151", tranche_code: "SGBFEB33", nse_symbol: "SGBFEB33VIII", issue_date: "2023-02-17", maturity_date: "2033-02-17", issue_price: 5634 },
  { isin: "IN0020220169", tranche_code: "SGBMAR33", nse_symbol: "SGBMAR33IX", issue_date: "2023-03-14", maturity_date: "2033-03-14", issue_price: 5545 },
  { isin: "IN0020230069", tranche_code: "SGBJUN33", nse_symbol: "SGBJUN33I", issue_date: "2023-06-27", maturity_date: "2033-06-27", issue_price: 5863 },
  { isin: "IN0020230085", tranche_code: "SGBSEP33", nse_symbol: "SGBSEP33II", issue_date: "2023-09-20", maturity_date: "2033-09-20", issue_price: 5923 },
  { isin: "IN0020230127", tranche_code: "SGBDEC33", nse_symbol: "SGBDE33III", issue_date: "2023-12-28", maturity_date: "2033-12-28", issue_price: 6199 },
  { isin: "IN0020230168", tranche_code: "SGBDE31III", nse_symbol: "SGBDE31III", issue_date: "2023-12-20", maturity_date: "2031-12-20", issue_price: 6199 },
  { isin: "IN0020230176", tranche_code: "SGBFEB34", nse_symbol: "SGBFEB34IV", issue_date: "2024-02-21", maturity_date: "2034-02-21", issue_price: 6261 },
];
