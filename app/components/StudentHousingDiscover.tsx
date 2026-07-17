import Link from "next/link";
import { MapPin } from "lucide-react";
import { CITIES } from "@/lib/cities";
import { universityMapPath, UNIVERSITIES } from "@/lib/universities";

/** Internal links + copy targeting common student housing search queries. */
export default function StudentHousingDiscover() {
  const cities = CITIES.filter((city) => city.status === "available");

  return (
    <section
      className="landing-section landing-section--discover"
      aria-labelledby="discover-housing"
    >
      <div className="landing-wrap discover-wrap">
        <div className="discover-head">
          <p className="landing-kicker">Student accommodation in Austria</p>
          <h2
            id="discover-housing"
            className="landing-headline landing-headline--sm discover-title"
          >
            By city &amp; university
          </h2>
          <p className="discover-lead">
            Apartments, shared flats and dorms for students — pick a campus and
            open the map.
          </p>
        </div>

        <ul className="discover-list">
          {cities.map((city) => {
            const unis = UNIVERSITIES.filter(
              (uni) => uni.cityId === city.id && uni.status === "available",
            );
            return (
              <li key={city.id} className="discover-row">
                <Link href={`/map/${city.id}`} className="discover-city">
                  <MapPin
                    className="discover-city-icon"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className="discover-city-name">{city.name}</span>
                  <span className="discover-city-meta">All listings</span>
                </Link>
                <div className="discover-chips" role="list">
                  {unis.map((uni) => (
                    <Link
                      key={uni.id}
                      href={universityMapPath(uni)}
                      className="discover-chip"
                      title={`${uni.name} — student housing`}
                    >
                      {uni.shortName}
                    </Link>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
