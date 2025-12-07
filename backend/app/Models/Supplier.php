<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Supplier extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'company_id',
        'name',
        'contact_person',
        'email',
        'phone',
        'address',
    ];

    /**
     * Get the company that owns the supplier.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the orders from this supplier.
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
